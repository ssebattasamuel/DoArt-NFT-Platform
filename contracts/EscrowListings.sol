
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

    struct ListingParams {
        address nftContract;
        uint256 tokenId;
        address buyer;
        uint256 price;
        uint256 minBid;
        uint256 escrowAmount;
        bool isAuction;
        uint256 auctionDuration;
    }

    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price,
        uint256 minBid,
        uint256 escrowAmount,
        bool isAuction,
        uint256 auctionDuration
    );

    event ListingUpdated(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 newPrice
    );

    event EarnestDeposited(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 depositAmount
    );

    event ArtworkApprovalUpdated(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        bool approved
    );

    event SaleApproved(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed approver,
        address buyer
    );

    event RoyaltyPaid(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    event SaleFinalized(
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address indexed buyer,
        uint256 price
    );

    event SaleCanceled(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed canceler
    );

    event ViewingPeriodExtended(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 newViewingPeriodEnd
    );

    constructor(address _storageContract, address _escrowAuctions) {
        storageContract = EscrowStorage(_storageContract);
        escrowAuctions = _escrowAuctions;
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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
        ListingParams memory params = ListingParams({
            nftContract: nftContract,
            tokenId: tokenId,
            buyer: buyer,
            price: price,
            minBid: minBid,
            escrowAmount: escrowAmount,
            isAuction: isAuction,
            auctionDuration: auctionDuration
        });
        _validateListing(params);
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        _createListing(params);
        if (isAuction) {
            IERC721(nftContract).approve(escrowAuctions, tokenId);
            _createAuction(nftContract, tokenId, minBid, auctionDuration);
        }
        emit NFTListed(
            nftContract,
            tokenId,
            msg.sender,
            buyer,
            price,
            minBid,
            escrowAmount,
            isAuction,
            auctionDuration
        );
    }

    function batchList(
        ListingParams[] calldata params
    ) external nonReentrant whenNotPaused {
        require(params.length > 0, "No tokens provided");
        require(params.length <= 50, "Batch size exceeds limit");

        for (uint256 i = 0; i < params.length; i++) {
            _validateListing(params[i]);
            IERC721(params[i].nftContract).transferFrom(msg.sender, address(this), params[i].tokenId);
            _createListing(params[i]);
            if (params[i].isAuction) {
                IERC721(params[i].nftContract).approve(escrowAuctions, params[i].tokenId);
                _createAuction(params[i].nftContract, params[i].tokenId, params[i].minBid, params[i].auctionDuration);
            }
            emit NFTListed(
                params[i].nftContract,
                params[i].tokenId,
                msg.sender,
                params[i].buyer,
                params[i].price,
                params[i].minBid,
                params[i].escrowAmount,
                params[i].isAuction,
                params[i].auctionDuration
            );
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
        emit EarnestDeposited(nftContract, tokenId, msg.sender, msg.value);
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
        emit ArtworkApprovalUpdated(nftContract, tokenId, msg.sender, approved);
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
        emit SaleApproved(nftContract, tokenId, msg.sender, listing.buyer);
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

        address buyer = listing.buyer != address(0) ? listing.buyer : msg.sender;

        (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, listing.price);
        uint256 sellerAmount = listing.price - royaltyAmount;

        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
            emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        }

        payable(listing.seller).transfer(sellerAmount);

        IERC721(nftContract).transferFrom(address(this), buyer, tokenId);

        if (listing.buyerDeposit > 0) {
            payable(buyer).transfer(listing.buyerDeposit);
        }

        storageContract.deleteListing(nftContract, tokenId);

        emit SaleFinalized(nftContract, tokenId, listing.seller, buyer, listing.price);
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

        emit SaleCanceled(nftContract, tokenId, msg.sender);
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
        emit ViewingPeriodExtended(nftContract, tokenId, msg.sender, newListing.viewingPeriodEnd);
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

    function _validateListing(ListingParams memory params) internal view {
        require(params.nftContract != address(0), "Invalid NFT contract");
        require(params.price > 0 || params.minBid > 0, "Price or minBid must be > 0");
        require(params.escrowAmount > 0, "Escrow amount must be > 0");
        require(IERC721(params.nftContract).ownerOf(params.tokenId) == msg.sender, "Not token owner");
        require(params.buyer != msg.sender, "Buyer cannot be seller");
        require(!storageContract.getListing(params.nftContract, params.tokenId).isListed, "Token already listed");
        require(
            IERC721(params.nftContract).getApproved(params.tokenId) == address(this) ||
                IERC721(params.nftContract).isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );
    }

    function _createListing(ListingParams memory params) internal {
        storageContract.setListing(params.nftContract, params.tokenId, EscrowStorage.Listing({
            nftContract: params.nftContract,
            seller: msg.sender,
            buyer: params.buyer,
            price: params.price,
            minBid: params.minBid,
            escrowAmount: params.escrowAmount,
            buyerDeposit: 0,
            viewingPeriodEnd: block.timestamp + storageContract.DEFAULT_VIEWING_PERIOD(),
            isListed: true,
            isApproved: false,
            saleApprover: address(0),
            isAuction: params.isAuction,
            tokenId: params.tokenId
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
