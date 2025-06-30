// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IEscrowListings {
    function transferForAuction(address nftContract, uint256 tokenId, address to) external;
}

contract EscrowAuctions is Ownable, ReentrancyGuard, Pausable, AccessControl {
    EscrowStorage public storageContract;
    address public escrowListings;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Emitted when a royalty is paid
    event RoyaltyPaid(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    // Emitted when multiple bids are placed
    event BatchBidPlaced(
        address indexed nftContract,
        uint256[] tokenIds,
        address indexed bidder,
        uint256[] amounts
    );

    // Emitted when a single bid is placed
    event BidPlaced(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    // Emitted when an auction is extended due to anti-sniping
    event AuctionExtended(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 newEndTime
    );

    // Emitted when an auction is finalized
    event AuctionFinalized(
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 amount
    );

    // Emitted when an auction is canceled
    event AuctionCanceled(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed caller
    );

    // Emitted when a bid is refunded
    event BidRefunded(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    constructor(address _storageContract, address _escrowListings) Ownable() {
        storageContract = EscrowStorage(_storageContract);
        escrowListings = _escrowListings;
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    modifier onlySeller(address nftContract, uint256 tokenId) {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(msg.sender == listing.seller, "Only seller");
        _;
    }
    
    function batchPlaceBid(address nftContract, uint256[] calldata tokenIds, uint256[] calldata amounts) 
        external 
        payable 
        nonReentrant 
        whenNotPaused {
        require(tokenIds.length > 0, "No tokens provided");
        require(tokenIds.length == amounts.length, "Mismatched array lengths");
        require(tokenIds.length <= 50, "Batch size exceeds limit");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalValue += amounts[i];
        }
        require(msg.value >= totalValue, "Insufficient payment");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _placeBid(nftContract, tokenIds[i], amounts[i]);
        }

        emit BatchBidPlaced(nftContract, tokenIds, msg.sender, amounts);
    }

    function batchPlaceAuctionBid(address nftContract, uint256[] calldata tokenIds, uint256[] calldata amounts) 
        external 
        payable 
        nonReentrant 
        whenNotPaused {
        require(tokenIds.length > 0, "No tokens provided");
        require(tokenIds.length == amounts.length, "Mismatched array lengths");
        require(tokenIds.length <= 50, "Batch size exceeds limit");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalValue += amounts[i];
        }
        require(msg.value >= totalValue, "Insufficient payment");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _placeAuctionBid(nftContract, tokenIds[i], amounts[i]);
        }

        emit BatchBidPlaced(nftContract, tokenIds, msg.sender, amounts);
    }

    function _placeBid(address nftContract, uint256 tokenId, uint256 amount) internal {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Use placeAuctionBid for auctions");
        require(msg.sender != listing.seller, "Seller cannot bid");
        require(listing.minBid > 0, "Bidding not enabled");
        require(listing.buyer == address(0), "Bidding only for open sales");
        require(amount >= listing.minBid, "Bid below minimum");

        EscrowStorage.Bid[] memory currentBids = storageContract.getBids(nftContract, tokenId);
        if (currentBids.length > 0) {
            require(amount > currentBids[currentBids.length - 1].amount, "Bid must be higher than current highest");
        }

        storageContract.pushBid(nftContract, tokenId, EscrowStorage.Bid({bidder: msg.sender, amount: amount}));
        emit BidPlaced(nftContract, tokenId, msg.sender, amount);
    }

    function _placeAuctionBid(address nftContract, uint256 tokenId, uint256 amount) internal {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(listing.isAuction, "Not an auction");
        require(msg.sender != listing.seller, "Seller cannot bid");

        EscrowStorage.Auction memory auction = storageContract.getAuction(nftContract, tokenId);
        require(auction.isActive, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(amount >= auction.minBid && (auction.highestBid == 0 || amount >= auction.highestBid + auction.minIncrement),
                "Bid too low");

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
            emit BidRefunded(nftContract, tokenId, auction.highestBidder, auction.highestBid);
        }

        storageContract.pushBid(nftContract, tokenId, EscrowStorage.Bid({bidder: msg.sender, amount: amount}));
        storageContract.setAuction(nftContract, tokenId, EscrowStorage.Auction({
            endTime: auction.endTime,
            minBid: auction.minBid,
            minIncrement: auction.minIncrement,
            highestBidder: msg.sender,
            highestBid: amount,
            isActive: auction.isActive
        }));

        if (auction.endTime - block.timestamp < storageContract.ANTI_SNIPING_WINDOW()) {
            uint256 newEndTime = block.timestamp + storageContract.ANTI_SNIPING_EXTENSION();
            storageContract.setAuction(nftContract, tokenId, EscrowStorage.Auction({
                endTime: newEndTime,
                minBid: auction.minBid,
                minIncrement: auction.minIncrement,
                highestBidder: msg.sender,
                highestBid: amount,
                isActive: auction.isActive
            }));
            emit AuctionExtended(nftContract, tokenId, newEndTime);
        }

        emit BidPlaced(nftContract, tokenId, msg.sender, amount);
    }

    function acceptBid(address nftContract, uint256 tokenId, uint256 bidIndex) 
        external 
        nonReentrant 
        whenNotPaused 
        onlySeller(nftContract, tokenId) 
    {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot accept bids for auctions");
        require(listing.isApproved, "Artwork not approved");

        EscrowStorage.Bid[] memory bidList = storageContract.getBids(nftContract, tokenId);
        require(bidIndex < bidList.length, "Invalid bid index");

        address buyer = bidList[bidIndex].bidder;
        uint256 salePrice = bidList[bidIndex].amount;

        for (uint256 i = 0; i < bidList.length; i++) {
            if (i != bidIndex) {
                payable(bidList[i].bidder).transfer(bidList[i].amount);
                emit BidRefunded(nftContract, tokenId, bidList[i].bidder, bidList[i].amount);
            }
        }
        storageContract.deleteBids(nftContract, tokenId);

        (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, salePrice);
        uint256 sellerAmount = salePrice - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
            emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        }

        payable(listing.seller).transfer(sellerAmount);
        IEscrowListings(escrowListings).transferForAuction(nftContract, tokenId, buyer);

        if (listing.buyerDeposit > 0) {
            payable(listing.buyer).transfer(listing.buyerDeposit);
            emit BidRefunded(nftContract, tokenId, listing.buyer, listing.buyerDeposit);
        }

        storageContract.deleteListing(nftContract, tokenId);
    }

    function endAuction(address nftContract, uint256 tokenId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        EscrowStorage.Auction memory auction = storageContract.getAuction(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(listing.isAuction, "Not an auction");
        require(auction.isActive, "Auction already ended");
        require(block.timestamp >= auction.endTime, "Auction not yet ended");

        storageContract.setAuction(nftContract, tokenId, EscrowStorage.Auction({
            endTime: auction.endTime,
            minBid: auction.minBid,
            minIncrement: auction.minIncrement,
            highestBidder: auction.highestBidder,
            highestBid: auction.highestBid,
            isActive: false
        }));

        if (auction.highestBidder == address(0)) {
            IEscrowListings(escrowListings).transferForAuction(nftContract, tokenId, listing.seller);
            storageContract.deleteListing(nftContract, tokenId);
            storageContract.deleteAuction(nftContract, tokenId);
            emit AuctionCanceled(nftContract, tokenId, msg.sender);
        } else {
            _finalizeAuction(nftContract, tokenId, listing.seller, auction.highestBidder, auction.highestBid);
            emit AuctionFinalized(nftContract, tokenId, listing.seller, auction.highestBidder, auction.highestBid);
        }
    }

    function cancelSale(address nftContract, uint256 tokenId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        EscrowStorage.Auction memory auction = storageContract.getAuction(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(listing.isAuction, "Not an auction");
        require(msg.sender == listing.seller || (auction.highestBidder == address(0) && msg.sender == listing.buyer), 
            "Only seller or buyer with no bids can cancel");

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
            emit BidRefunded(nftContract, tokenId, auction.highestBidder, auction.highestBid);
        }

        IEscrowListings(escrowListings).transferForAuction(nftContract, tokenId, listing.seller);

        storageContract.deleteListing(nftContract, tokenId);
        storageContract.deleteAuction(nftContract, tokenId);

        emit AuctionCanceled(nftContract, tokenId, msg.sender);
    }

    function _calculateRoyalty(address nftContract, uint256 tokenId, uint256 salePrice)
        internal
        view
        returns (address recipient, uint256 amount)
    {
        recipient = address(0);
        amount = 0;
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 royalty) {
            recipient = receiver;
            amount = royalty;
        } catch {}
    }

    function _finalizeAuction(address nftContract, uint256 tokenId, address seller, address highestBidder, uint256 highestBid) 
        internal 
    {
        require(IERC721(nftContract).ownerOf(tokenId) == escrowListings, "Token not in escrow");
        (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, highestBid);
        uint256 sellerAmount = highestBid - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
            emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        }

        payable(seller).transfer(sellerAmount);
        IEscrowListings(escrowListings).transferForAuction(nftContract, tokenId, highestBidder);

        storageContract.deleteListing(nftContract, tokenId);
        storageContract.deleteAuction(nftContract, tokenId);
    }

    function setEscrowListings(address _escrowListings) 
        external 
    {
        require(msg.sender == owner(), "Only owner");
        require(_escrowListings != address(0), "Invalid address");
        escrowListings = _escrowListings;
    }
}