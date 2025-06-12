// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import"@openzeppelin/contracts/access/AccessControl.sol";

interface IEscrowListings {
    function transferForAuction(address nftContract, uint256 tokenId, address to) external;
}

contract EscrowAuctions is Ownable, ReentrancyGuard,Pausable, AccessControl {
    EscrowStorage public storageContract;
   
    address public escrowListings;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event Action(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint8 actionType,
        address indexed user,
        uint256 value
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
            uint256 newEndTime = auction.endTime + storageContract.ANTI_SNIPING_EXTENSION();
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

   
    function acceptBid(address nftContract, uint256 tokenId, uint256 bidIndex) external nonReentrant whenNotPaused onlySeller(nftContract, tokenId) {
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
            }
        }
        storageContract.deleteBids(nftContract, tokenId);

        (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, salePrice);
        uint256 sellerAmount = salePrice - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
            emit Action(nftContract, tokenId, 2, royaltyRecipient, royaltyAmount);
        }

        payable(listing.seller).transfer(sellerAmount);
        IERC721(nftContract).transferFrom(address(this), buyer, tokenId);

        if (listing.buyerDeposit > 0) {
            payable(listing.buyer).transfer(listing.buyerDeposit);
        }

        storageContract.deleteListing(nftContract, tokenId);

        emit Action(nftContract, tokenId, 2, buyer, salePrice);
    }

    function endAuction(address nftContract, uint256 tokenId) external nonReentrant whenNotPaused {
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
            IERC721(nftContract).transferFrom(address(this), listing.seller, tokenId);
            storageContract.deleteListing(nftContract, tokenId);
            storageContract.deleteAuction(nftContract, tokenId);
            emit Action(nftContract, tokenId, 7, msg.sender, 0);
        } else {
            _finalizeAuction(nftContract, tokenId, listing.seller, auction.highestBidder, auction.highestBid);
        }
    }

    function cancelSale(address nftContract, uint256 tokenId) external nonReentrant whenNotPaused {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        EscrowStorage.Auction memory auction = storageContract.getAuction(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
       
        require(listing.isAuction, "Not an auction");
        require(msg.sender == listing.seller || (auction.highestBidder == address(0) && msg.sender == listing.buyer), 
            "Only seller or buyer with no bids can cancel");

        
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        IERC721(nftContract).transferFrom(address(this), listing.seller, tokenId);

        storageContract.deleteListing(nftContract, tokenId);
        storageContract.deleteAuction(nftContract, tokenId);

        emit Action(nftContract, tokenId, 7, msg.sender, 0);
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

  
function _finalizeAuction(address nftContract, uint256 tokenId, address seller, address highestBidder, uint256 highestBid) internal {
    require(IERC721(nftContract).ownerOf(tokenId) == address(this), "Token not in escrow");
    (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, highestBid);
    uint256 sellerAmount = highestBid - royaltyAmount;

    if (royaltyAmount > 0) {
        payable(royaltyRecipient).transfer(royaltyAmount);
        emit Action(nftContract, tokenId, 2, royaltyRecipient, royaltyAmount);
    }

    payable(seller).transfer(sellerAmount);
    IEscrowListings(escrowListings).transferForAuction(nftContract, tokenId, highestBidder);

    storageContract.deleteListing(nftContract, tokenId);
    storageContract.deleteAuction(nftContract, tokenId);

    emit Action(nftContract, tokenId, 4, highestBidder, highestBid);
    emit Action(nftContract, tokenId, 2, highestBidder, highestBid);
}
function setEscrowListings(address _escrowListings) external {
    require(msg.sender == owner(), "Only owner");
    require(_escrowListings != address(0), "Invalid address");
    escrowListings = _escrowListings;
}
}