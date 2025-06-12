// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowStorage.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract EscrowListings is Pausable, ReentrancyGuard, AccessControl {
    EscrowStorage public storageContract;
   
    address public escrowAuctions;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event Action(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint8 actionType,
        address indexed user,
        uint256 value
    );

    event ListingUpdated(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 newPrice
    );

    constructor(address _storageContract, address _escrowAuctions) {
        storageContract = EscrowStorage(_storageContract);
        escrowAuctions = _escrowAuctions;
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

    modifier onlyBuyer(address nftContract, uint256 tokenId) {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(
            listing.buyer == address(0) || msg.sender == listing.buyer,
            "Only designated buyer"
        );
        _;
    }

    function list(
        address nftContract,
        uint256 tokenId,
        address buyer,
        uint256 price,
        uint256 minBid,
        uint256 escrowAmount,
        bool isAuction,
        uint256 auctionDuration
    ) external nonReentrant whenNotPaused {
        _validateListing(nftContract, tokenId, buyer, price, minBid, escrowAmount);
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        _createListing(nftContract, tokenId, buyer, price, minBid, escrowAmount, isAuction);
        if (isAuction) {
            IERC721(nftContract).approve(escrowAuctions, tokenId);
            _createAuction(nftContract, tokenId, minBid, auctionDuration);
        }
        emit Action(nftContract, tokenId, 1, msg.sender, price);
    }

    function batchList(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        address[] calldata buyers,
        uint256[] calldata prices,
        uint256[] calldata minBids,
        uint256[] calldata escrowAmounts,
        bool[] calldata isAuctions,
        uint256[] calldata auctionDurations
    ) external nonReentrant whenNotPaused {
        require(nftContracts.length > 0, "No tokens provided");
        require(
            nftContracts.length == tokenIds.length &&
            nftContracts.length == buyers.length &&
            nftContracts.length == prices.length &&
            nftContracts.length == minBids.length &&
            nftContracts.length == escrowAmounts.length &&
            nftContracts.length == isAuctions.length &&
            nftContracts.length == auctionDurations.length,
            "Mismatched array lengths"
        );
        require(nftContracts.length <= 50, "Batch size exceeds limit");

        for (uint256 i = 0; i < nftContracts.length; i++) {
            _validateListing(
                nftContracts[i],
                tokenIds[i],
                buyers[i],
                prices[i],
                minBids[i],
                escrowAmounts[i]
            );
            IERC721(nftContracts[i]).transferFrom(msg.sender, address(this), tokenIds[i]);
            _createListing(
                nftContracts[i],
                tokenIds[i],
                buyers[i],
                prices[i],
                minBids[i],
                escrowAmounts[i],
                isAuctions[i]
            );
            if (isAuctions[i]) {
                IERC721(nftContracts[i]).approve(escrowAuctions, tokenIds[i]);
                _createAuction(nftContracts[i], tokenIds[i], minBids[i], auctionDurations[i]);
            }
            emit Action(nftContracts[i], tokenIds[i], 1, msg.sender, prices[i]);
        }
    }

    function updateListing(
        address nftContract,
        uint256 tokenId,
        uint256 newPrice
    ) external nonReentrant whenNotPaused onlySeller(nftContract, tokenId) {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot update auction listings");
        require(newPrice > 0, "Price must be greater than 0");
        require(!listing.isApproved, "Cannot update approved listing");

        EscrowStorage.Listing memory updatedListing = listing;
        updatedListing.price = newPrice;
        updatedListing.tokenId = tokenId;

        storageContract.setListing(nftContract, tokenId, updatedListing);

        emit ListingUpdated(nftContract, tokenId, msg.sender, newPrice);
    }

    function depositEarnest(address nftContract, uint256 tokenId) external payable nonReentrant whenNotPaused onlyBuyer(nftContract, tokenId) {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot deposit for auctions");
        require(msg.value > 0, "Deposit must be > 0");
        require(
            listing.buyerDeposit + msg.value <= listing.escrowAmount,
            "Deposit exceeds escrow amount"
        );

        EscrowStorage.Listing memory newListing = listing;
        if (newListing.buyer == address(0)) {
            newListing.buyer = msg.sender;
        }
        newListing.buyerDeposit += msg.value;
        newListing.tokenId = tokenId;

        storageContract.setListing(nftContract, tokenId, newListing);
        emit Action(nftContract, tokenId, 5, msg.sender, msg.value);
    }

    function approveArtwork(address nftContract, uint256 tokenId, bool approved) external whenNotPaused onlyBuyer(nftContract, tokenId) {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot approve auctions");
        require(block.timestamp <= listing.viewingPeriodEnd, "Viewing period ended");
        require(!listing.isApproved, "Artwork already approved");

        EscrowStorage.Listing memory newListing = listing;
        newListing.isApproved = approved;
        newListing.tokenId = tokenId;

        storageContract.setListing(nftContract, tokenId, newListing);
        emit Action(nftContract, tokenId, 6, msg.sender, approved ? 1 : 0);
    }

    function approveSale(address nftContract, uint256 tokenId) external whenNotPaused {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot approve auctions");
        require(
            msg.sender == listing.seller ||
                (listing.buyer != address(0) && msg.sender == listing.buyer),
            "Only seller or buyer can approve"
        );
        require(listing.isApproved, "Artwork not approved");
        require(listing.buyerDeposit >= listing.escrowAmount, "Deposit not met");

        EscrowStorage.Listing memory newListing = listing;
        newListing.saleApprover = msg.sender;
        newListing.tokenId = tokenId;

        storageContract.setListing(nftContract, tokenId, newListing);
        emit Action(nftContract, tokenId, 6, msg.sender, 1);
    }

    function finalizeSale(address nftContract, uint256 tokenId) external payable nonReentrant whenNotPaused {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot finalize auctions");
        require(listing.isApproved, "Artwork not approved");
        require(listing.buyerDeposit >= listing.escrowAmount, "Deposit not met");
        require(msg.value >= listing.price, "Insufficient payment");
        require(IERC721(nftContract).ownerOf(tokenId) == address(this), "Token not in escrow");
        require(listing.buyer == address(0) || msg.sender == listing.buyer, "Only designated buyer");
        require(listing.saleApprover != address(0), "Sale not approved");

        listing.tokenId = tokenId;

        address buyer = listing.buyer != address(0) ? listing.buyer : msg.sender;

        (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, listing.price);
        uint256 sellerAmount = listing.price - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
            emit Action(nftContract, tokenId, 2, royaltyRecipient, royaltyAmount);
        }

        payable(listing.seller).transfer(sellerAmount);

        IERC721(nftContract).transferFrom(address(this), buyer, tokenId);

        if (listing.buyerDeposit > 0) {
            payable(buyer).transfer(listing.buyerDeposit);
        }

        storageContract.deleteListing(nftContract, tokenId);

        emit Action(nftContract, tokenId, 2, buyer, listing.price);
    }

    function cancelSale(address nftContract, uint256 tokenId) external nonReentrant whenNotPaused {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot cancel auctions");
        require(
            msg.sender == listing.seller ||
                (!listing.isAuction && listing.buyer != address(0) && msg.sender == listing.buyer),
            "Only seller or buyer can cancel"
        );
        require(!listing.isApproved, "Cannot cancel approved artwork");

        listing.tokenId = tokenId;

        EscrowStorage.Bid[] memory bidList = storageContract.getBids(nftContract, tokenId);
        for (uint256 i = 0; i < bidList.length; i++) {
            payable(bidList[i].bidder).transfer(bidList[i].amount);
        }
        storageContract.deleteBids(nftContract, tokenId);

        if (listing.buyerDeposit > 0) {
            payable(listing.buyer).transfer(listing.buyerDeposit);
        }

        IERC721(nftContract).transferFrom(address(this), listing.seller, tokenId);

        storageContract.deleteListing(nftContract, tokenId);

        emit Action(nftContract, tokenId, 7, msg.sender, 0);
    }

    function extendViewingPeriod(address nftContract, uint256 tokenId, uint256 additionalTime) external onlySeller(nftContract, tokenId) {
        EscrowStorage.Listing memory listing = storageContract.getListing(nftContract, tokenId);
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot extend auctions");
        require(additionalTime > 0, "Additional time must be > 0");

        EscrowStorage.Listing memory newListing = listing;
        newListing.viewingPeriodEnd += additionalTime;
        newListing.tokenId = tokenId;
    
        storageContract.setListing(nftContract, tokenId, newListing);
        emit Action(nftContract, tokenId, 8, msg.sender, newListing.viewingPeriodEnd);
    }

    function transferForAuction(address nftContract, uint256 tokenId, address to) external whenNotPaused {
        require(msg.sender == escrowAuctions, "Only EscrowAuctions");
        require(IERC721(nftContract).ownerOf(tokenId) == address(this), "Token not in escrow");
        IERC721(nftContract).transferFrom(address(this), to, tokenId);
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

    function _validateListing(
        address nftContract,
        uint256 tokenId,
        address buyer,
        uint256 price,
        uint256 minBid,
        uint256 escrowAmount
    ) internal view {
        require(nftContract != address(0), "Invalid NFT contract");
        require(price > 0 || minBid > 0, "Price or minBid must be > 0");
        require(escrowAmount > 0, "Escrow amount must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(buyer != msg.sender, "Buyer cannot be seller");
        require(!storageContract.getListing(nftContract, tokenId).isListed, "Token already listed");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
                IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );
    }

    function _createListing(
        address nftContract,
        uint256 tokenId,
        address buyer,
        uint256 price,
        uint256 minBid,
        uint256 escrowAmount,
        bool isAuction
    ) internal {
        storageContract.setListing(nftContract, tokenId, EscrowStorage.Listing({
            nftContract: nftContract,
            seller: msg.sender,
            buyer: buyer,
            price: price,
            minBid: minBid,
            escrowAmount: escrowAmount,
            buyerDeposit: 0,
            viewingPeriodEnd: block.timestamp + storageContract.DEFAULT_VIEWING_PERIOD(),
            isListed: true,
            isApproved: false,
            saleApprover: address(0),
            isAuction: isAuction,
            tokenId: tokenId
        }));
    }

    function _createAuction(address nftContract, uint256 tokenId, uint256 minBid, uint256 auctionDuration) internal {
        require(auctionDuration >= 1 hours, "Auction duration too short");
        storageContract.setAuction(nftContract, tokenId, EscrowStorage.Auction({
            endTime: block.timestamp + auctionDuration,
            minBid: minBid,
            minIncrement: minBid / 10,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true
        }));
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}