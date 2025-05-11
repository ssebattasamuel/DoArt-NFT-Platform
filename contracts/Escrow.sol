// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IDoArt {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
    function ownerOf(uint256 tokenId) external view returns (address);
    function getArtistMetadata(address artist) external view returns (string memory name, string memory bio, string memory portfolioUrl);
}

contract Escrow is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    address public immutable nftAddress;

    // Duration of the viewing period in seconds (default: 3 days)
    uint256 public constant DEFAULT_VIEWING_PERIOD = 3 days;

    struct Listing {
        address seller;
        address buyer; // address(0) for open sales
        uint256 price;
        uint256 escrowAmount;
        uint256 buyerDeposit;
        uint256 viewingPeriodEnd;
        bool isListed;
        bool isApproved;
        address saleApprover; // Tracks who approved the sale (buyer or seller)
    }

    // Mapping of token ID to listing details
    mapping(uint256 => Listing) public listings;

    // Events
    event Listed(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 escrowAmount);
    event BatchListed(uint256[] tokenIds, address indexed seller, address indexed buyer, uint256[] prices, uint256[] escrowAmounts);
    event Deposited(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event Approved(uint256 indexed tokenId, address indexed approver, bool approved);
    event Purchased(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event RoyaltyPaid(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    event Canceled(uint256 indexed tokenId, address indexed initiator);
    event ViewingPeriodUpdated(uint256 indexed tokenId, uint256 newEndTime);

    constructor(address _nftAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        nftAddress = _nftAddress;
    }

    modifier onlySeller(uint256 tokenId) {
        require(msg.sender == listings[tokenId].seller, "Only seller can call this");
        _;
    }

    modifier onlyBuyer(uint256 tokenId) {
        require(listings[tokenId].buyer == address(0) || msg.sender == listings[tokenId].buyer, 
                "Only designated buyer can call this");
        _;
    }

    function list(uint256 tokenId, address buyer, uint256 price, uint256 escrowAmount) 
        public 
        whenNotPaused 
    {
        require(price > 0, "Price must be greater than zero");
        require(escrowAmount > 0, "Escrow amount must be greater than zero");
        require(buyer != msg.sender, "Buyer cannot be seller");
        require(!listings[tokenId].isListed, "Token already listed");
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftAddress).getApproved(tokenId) == address(this) || 
                IERC721(nftAddress).isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");

        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing({
            seller: msg.sender,
            buyer: buyer, // address(0) for open sales
            price: price,
            escrowAmount: escrowAmount,
            buyerDeposit: 0,
            viewingPeriodEnd: block.timestamp + DEFAULT_VIEWING_PERIOD,
            isListed: true,
            isApproved: false,
            saleApprover: address(0)
        });

        emit Listed(tokenId, msg.sender, buyer, price, escrowAmount);
    }

    function batchList(uint256[] memory tokenIds, address buyer, uint256[] memory prices, uint256[] memory escrowAmounts) 
        public 
        whenNotPaused 
    {
        require(tokenIds.length > 0, "No tokens provided");
        require(tokenIds.length == prices.length, "Mismatched array lengths");
        require(tokenIds.length == escrowAmounts.length, "Mismatched array lengths");
        require(tokenIds.length <= 50, "Batch size exceeds limit");
        require(buyer != msg.sender, "Buyer cannot be seller");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(prices[i] > 0, "Price must be greater than zero");
            require(escrowAmounts[i] > 0, "Escrow amount must be greater than zero");
            require(!listings[tokenIds[i]].isListed, "Token already listed");
            require(IERC721(nftAddress).ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(IERC721(nftAddress).getApproved(tokenIds[i]) == address(this) || 
                    IERC721(nftAddress).isApprovedForAll(msg.sender, address(this)), 
                    "Contract not approved");

            IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenIds[i]);

            listings[tokenIds[i]] = Listing({
                seller: msg.sender,
                buyer: buyer, // address(0) for open sales
                price: prices[i],
                escrowAmount: escrowAmounts[i],
                buyerDeposit: 0,
                viewingPeriodEnd: block.timestamp + DEFAULT_VIEWING_PERIOD,
                isListed: true,
                isApproved: false,
                saleApprover: address(0)
            });
        }

        emit BatchListed(tokenIds, msg.sender, buyer, prices, escrowAmounts);
    }

    function depositEarnest(uint256 tokenId) 
        public 
        payable 
        onlyBuyer(tokenId) 
        nonReentrant 
        whenNotPaused 
    {
        require(listings[tokenId].isListed, "Token not listed");
        require(msg.value > 0, "Deposit must be greater than zero");
        require(listings[tokenId].buyerDeposit + msg.value <= listings[tokenId].escrowAmount, 
                "Deposit exceeds escrow amount");

        // For open sales, set the buyer to the depositor if not already set
        if (listings[tokenId].buyer == address(0)) {
            listings[tokenId].buyer = msg.sender;
        }

        listings[tokenId].buyerDeposit += msg.value;
        emit Deposited(tokenId, msg.sender, msg.value);
    }

    function approveArtwork(uint256 tokenId, bool approved) 
        public 
        onlyBuyer(tokenId) 
        whenNotPaused 
    {
        require(listings[tokenId].isListed, "Token not listed");
        require(block.timestamp <= listings[tokenId].viewingPeriodEnd, "Viewing period ended");
        require(!listings[tokenId].isApproved, "Artwork already approved");

        listings[tokenId].isApproved = approved;
        emit Approved(tokenId, msg.sender, approved);
    }

    function approveSale(uint256 tokenId) 
        public 
        whenNotPaused 
    {
        require(listings[tokenId].isListed, "Token not listed");
        require(msg.sender == listings[tokenId].seller || 
                (listings[tokenId].buyer != address(0) && msg.sender == listings[tokenId].buyer), 
                "Only seller or buyer can approve");
        require(listings[tokenId].isApproved, "Artwork not approved");
        require(listings[tokenId].buyerDeposit >= listings[tokenId].escrowAmount, 
                "Deposit not met");

        listings[tokenId].saleApprover = msg.sender;
        emit Approved(tokenId, msg.sender, true);
    }

    function finalizeSale(uint256 tokenId) 
        public 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Listing memory listing = listings[tokenId];
        require(listing.isListed, "Token not listed");
        require(listing.isApproved, "Artwork not approved");
        require(listing.buyerDeposit >= listing.escrowAmount, "Deposit not met");
        require(msg.value >= listing.price, "Insufficient payment");
        require(IERC721(nftAddress).ownerOf(tokenId) == address(this), "Token not in escrow");
        require(listing.buyer == address(0) || msg.sender == listing.buyer, "Only designated buyer");
        require(listing.saleApprover != address(0), "Sale not approved by both parties");

        address buyer = listing.buyer != address(0) ? listing.buyer : msg.sender;

        // Pay royalty and seller
        (address royaltyRecipient, uint256 royaltyAmount) = IDoArt(nftAddress).royaltyInfo(tokenId, listing.price);
        uint256 sellerAmount = listing.price - royaltyAmount;

        if (royaltyAmount > 0) {
            (bool success1,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(success1, "Royalty transfer failed");
            emit RoyaltyPaid(tokenId, royaltyRecipient, royaltyAmount);
        }

        (bool success2,) = payable(listing.seller).call{value: sellerAmount}("");
        require(success2, "Seller transfer failed");

        // Transfer NFT to buyer
        IERC721(nftAddress).transferFrom(address(this), buyer, tokenId);

        // Refund excess deposit
        if (listing.buyerDeposit > 0) {
            (bool success3,) = payable(buyer).call{value: listing.buyerDeposit}("");
            require(success3, "Deposit refund failed");
        }

        // Clear listing
        delete listings[tokenId];

        emit Purchased(tokenId, buyer, listing.price);
    }

    function cancelSale(uint256 tokenId) 
        public 
        nonReentrant 
        whenNotPaused 
    {
        require(listings[tokenId].isListed, "Token not listed");
        require(msg.sender == listings[tokenId].seller || 
                (listings[tokenId].buyer != address(0) && msg.sender == listings[tokenId].buyer), 
                "Only seller or buyer can cancel");
        require(!listings[tokenId].isApproved, "Cannot cancel approved artwork");

        Listing memory listing = listings[tokenId];

        // Refund buyer deposit
        if (listing.buyerDeposit > 0) {
            (bool success,) = payable(listing.buyer).call{value: listing.buyerDeposit}("");
            require(success, "Deposit refund failed");
        }

        // Return NFT to seller
        IERC721(nftAddress).transferFrom(address(this), listing.seller, tokenId);

        // Clear listing
        delete listings[tokenId];

        emit Canceled(tokenId, msg.sender);
    }

    function extendViewingPeriod(uint256 tokenId, uint256 additionalTime) 
        public 
        onlySeller(tokenId) 
        whenNotPaused 
    {
        require(listings[tokenId].isListed, "Token not listed");
        require(additionalTime > 0, "Additional time must be greater than zero");

        listings[tokenId].viewingPeriodEnd += additionalTime;
        emit ViewingPeriodUpdated(tokenId, listings[tokenId].viewingPeriodEnd);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}