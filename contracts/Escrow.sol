// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC2981 {
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount);
}

contract Escrow is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    
    uint256 public constant DEFAULT_VIEWING_PERIOD = 3 days;
    uint256 public constant ANTI_SNIPING_EXTENSION = 10 minutes;
    uint256 public constant ANTI_SNIPING_WINDOW = 5 minutes;

    struct Bid {
        address bidder;
        uint256 amount;
    }

    struct Auction {
        uint256 endTime;
        uint256 minBid;
        uint256 minIncrement;
        uint256 highestBidder;
        uint256 highestBid;
        bool isActive;
    }

    struct Listing {
        address nftContract; // Supports any ERC721 contract
        address seller;
        address buyer; // address(0) for open sales
        uint256 price; // Fixed price for non-bidding sales
        uint256 minBid; // Minimum bid for bidding (0 if bidding disabled)
        uint256 escrowAmount;
        uint256 buyerDeposit;
        uint256 viewingPeriodEnd;
        bool isListed;
        bool isApproved;
        address saleApprover; // Tracks who approved the sale
        bool isAuction;
    }

    // Mapping of (nftContract, tokenId) to listing details
    mapping(address => mapping(uint256 => Listing)) public listings;
    // Mapping of (nftContract, tokenId) to array of bids
    mapping(address => mapping(uint256 => Bid[])) public bids;
    mapping( address => mapping(uint256 => Auction)) public auctions;

    // Events
    event Listed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, address buyer, uint256 price, uint256 minBid, uint256 escrowAmount, bool isAuction, uint256 auctionEndTime);
    event BidPlaced(address indexed nftContract, uint256 indexed tokenId, address indexed bidder, uint256 amount, bool isAuction);
    // event BidAccepted(address indexed nftContract, uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(address indexed nftContract, uint256 indexed tokenId, address indexed winner, uint256 amount);
    event Deposited(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event Approved(address indexed nftContract, uint256 indexed tokenId, address indexed approver, bool approved);
    event Purchased(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event RoyaltyPaid(address indexed nftContract, uint256 indexed tokenId, address indexed recipient, uint256 amount);
    event Canceled(address indexed nftContract, uint256 indexed tokenId, address indexed initiator);
    event ViewingPeriodUpdated(address indexed nftContract, uint256 indexed tokenId, uint256 newEndTime);
    event AuctionExtended(address indexed nftContract, uint256 indexed tokenId, uint256 newEndTime);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
    }

    modifier onlySeller(address nftContract, uint256 tokenId) {
        require(msg.sender == listings[nftContract][tokenId].seller, "Only seller can call this");
        _;
    }

    modifier onlyBuyer(address nftContract, uint256 tokenId) {
        require(listings[nftContract][tokenId].buyer == address(0) || msg.sender == listings[nftContract][tokenId].buyer, 
                "Only designated buyer can call this");
        _;
    }

    function list(address nftContract, uint256 tokenId, address buyer, uint256 price, uint256 minBid, uint256 escrowAmount, bool isAuction, uint256 auctionDuration) 
        public 
        whenNotPaused 
    {
        require(nftContract != address(0), "Invalid NFT contract");
        require(price > 0 || minBid > 0, "Price or minBid must be greater than zero");
        require(escrowAmount > 0, "Escrow amount must be greater than zero");
        require(buyer != msg.sender, "Buyer cannot be seller");
        require(!listings[nftContract][tokenId].isListed, "Token already listed");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).getApproved(tokenId) == address(this) || 
                IERC721(nftContract).isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        uint256 auctionEndTime = isAuction ? block.timestamp + auctionDuration : 0;

        listings[nftContract][tokenId] = Listing({
            nftContract: nftContract,
            seller: msg.sender,
            buyer: buyer,
            price: price,
            minBid: minBid,
            escrowAmount: escrowAmount,
            buyerDeposit: 0,
            viewingPeriodEnd: block.timestamp + DEFAULT_VIEWING_PERIOD,
            isListed: true,
            isApproved: false,
            saleApprover: address(0),
            isAuction: isAuction
        });

         if (isAuction) {
            require(auctionDuration >= 1 hours, "Auction duration too short");
            auctions[nftContract][tokenId] = Auction({
                endTime: auctionEndTime,
                minBid: minBid,
                minIncrement: minBid / 10,
                highestBidder: address(0),
                highestBid: 0,
                isActive: true
            });
        }


        emit Listed(nftContract, tokenId, msg.sender, buyer, price, minBid, escrowAmount);
    }

    function placeBid(address nftContract, uint256 tokenId) 
        public 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Use placeAuctionBid for auctions");
        require(listing.minBid > 0, "Bidding not enabled");
        require(listing.buyer == address(0), "Bidding only for open sales");
        require(msg.value >= listing.minBid, "Bid below minimum");
        require(msg.sender != listing.seller, "Seller cannot bid");

        // Ensure bid is higher than previous bids
        Bid[] memory currentBids = bids[nftContract][tokenId];
        if (currentBids.length > 0) {
            require(msg.value > currentBids[currentBids.length - 1].amount, "Bid must be higher than current highest");
        }

        bids[nftContract][tokenId].push(Bid({
            bidder: msg.sender,
            amount: msg.value
        }));

        emit BidPlaced(nftContract, tokenId, msg.sender, msg.value);
    }

       function placeAuctionBid(address nftContract, uint256 tokenId) 
        public 
        payable 
        whenNotPaused 
        nonReentrant 
    {
        Listing memory listing = listings[nftContract][tokenId];
        Auction memory auction = auctions[nftContract][tokenId];
        require(listing.isListed, "Token not listed");
        require(listing.isAuction, "Not an auction");
        require(auction.isActive, "Auction ended");
        require(block.timestamp < auction.endTime, "Auction expired");
        require(msg.sender != listing.seller, "Seller cannot bid");
        require(msg.value >= auction.minBid && (auction.highestBid == 0 || msg.value >= auction.highestBid + auction.minIncrement), 
                "Bid too low");

        if (auction.highestBidder != address(0)) {
            (bool success,) = auction.highestBidder.call{value: auction.highestBid}("");
            require(success, "Refund failed");
        }

        auctions[nftContract][tokenId].highestBidder = msg.sender;
        auctions[nftContract][tokenId].highestBid = msg.value;

        if (auction.endTime - block.timestamp < ANTI_SNIPING_WINDOW) {
            auctions[nftContract][tokenId].endTime += ANTI_SNIPING_EXTENSION;
            emit AuctionExtended(nftContract, tokenId, auctions[nftContract][tokenId].endTime);
        }

        emit BidPlaced(nftContract, tokenId, msg.sender, msg.value, true);
    }

    function acceptBid(address nftContract, uint256 tokenId, uint256 bidIndex) 
        public 
        onlySeller(nftContract, tokenId) 
        whenNotPaused 
        nonReentrant 
    {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot accept bids for auctions");
        require(listing.isApproved, "Artwork not approved");
        require(bidIndex < bids[nftContract][tokenId].length, "Invalid bid index");

        Bid memory acceptedBid = bids[nftContract][tokenId][bidIndex];
        address buyer = acceptedBid.bidder;
        uint256 salePrice = acceptedBid.amount;

        // Refund other bidders
        for (uint256 i = 0; i < bids[nftContract][tokenId].length; i++) {
            if (i != bidIndex) {
                (bool success,) = bids[nftContract][tokenId][i].bidder.call{value: bids[nftContract][tokenId][i].amount}("");
                require(success, "Refund failed");
            }
        }
        delete bids[nftContract][tokenId];

        // Pay royalty and seller
        uint256 royaltyAmount = 0;
        address royaltyRecipient = address(0);
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 amount) {
            royaltyRecipient = receiver;
            royaltyAmount = amount;
        } catch {}
        uint256 sellerAmount = salePrice - royaltyAmount;

        if (royaltyAmount > 0) {
            (bool success1,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(success1, "Royalty transfer failed");
            emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        }

        (bool success2,) = payable(listing.seller).call{value: sellerAmount}("");
        require(success2, "Seller transfer failed");

        // Transfer NFT to buyer
        IERC721(nftContract).transferFrom(address(this), buyer, tokenId);

        // Refund buyer deposit (if any)
        if (listing.buyerDeposit > 0) {
            (bool success3,) = payable(listing.buyer).call{value: listing.buyerDeposit}("");
            require(success3, "Deposit refund failed");
        }

        // Clear listing
        delete listings[nftContract][tokenId];

       
        emit Purchased(nftContract, tokenId, buyer, salePrice);
    }
     function endAuction(address nftContract, uint256 tokenId) 
        public 
        whenNotPaused 
        nonReentrant 
    {
        Listing memory listing = listings[nftContract][tokenId];
        Auction memory auction = auctions[nftContract][tokenId];
        require(listing.isListed, "Token not listed");
        require(listing.isAuction, "Not an auction");
        require(auction.isActive, "Auction already ended");
        require(block.timestamp >= auction.endTime, "Auction not yet ended");

        auctions[nftContract][tokenId].isActive = false;

        if (auction.highestBidder == address(0)) {
            IERC721(nftContract).transferFrom(address(this), listing.seller, tokenId);
            delete listings[nftContract][tokenId];
            delete auctions[nftContract][tokenId];
            emit Canceled(nftContract, tokenId, msg.sender);
        } else {
            uint256 salePrice = auction.highestBid;
            uint256 royaltyAmount = 0;
            address royaltyRecipient = address(0);
            try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 amount) {
                royaltyRecipient = receiver;
                royaltyAmount = amount;
            } catch {}
            uint256 sellerAmount = salePrice - royaltyAmount;

            if (royaltyAmount > 0) {
                (bool success1,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
                require(success1, "Royalty transfer failed");
                emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
            }

            (bool success2,) = payable(listing.seller).call{value: sellerAmount}("");
            require(success2, "Seller transfer failed");

            IERC721(nftContract).transferFrom(address(this), auction.highestBidder, tokenId);

            delete listings[nftContract][tokenId];
            delete auctions[nftContract][tokenId];

            emit AuctionEnded(nftContract, tokenId, auction.highestBidder, salePrice);
            emit Purchased(nftContract, tokenId, auction.highestBidder, salePrice);
        }
    }

    function depositEarnest(address nftContract, uint256 tokenId) 
        public 
        payable 
        onlyBuyer(nftContract, tokenId) 
        nonReentrant 
        whenNotPaused 
    {
        require(listings[nftContract][tokenId].isListed, "Token not listed");
        require(!listings[nftContract][tokenId].isAuction, "Cannot deposit for auctions");
        require(msg.value > 0, "Deposit must be greater than zero");
        require(listings[nftContract][tokenId].buyerDeposit + msg.value <= listings[nftContract][tokenId].escrowAmount, 
                "Deposit exceeds escrow amount");

        // For open sales, set the buyer to the depositor if not already set
         if (listings[nftContract][tokenId].buyer == address(0)) {
            listings[nftContract][tokenId].buyer = msg.sender;
        }
       
        listings[nftContract][tokenId].buyerDeposit += msg.value;
        emit Deposited(nftContract, tokenId, msg.sender, msg.value);
    }

    function approveArtwork(address nftContract, uint256 tokenId, bool approved) 
        public 
        onlyBuyer(nftContract, tokenId) 
        whenNotPaused 
    {
        require(listings[nftContract][tokenId].isListed, "Token not listed");
         require(!listings[nftContract][tokenId].isAuction, "Cannot approve auctions");
        require(block.timestamp <= listings[nftContract][tokenId].viewingPeriodEnd, "Viewing period ended");
        require(!listings[nftContract][tokenId].isApproved, "Artwork already approved");

        listings[nftContract][tokenId].isApproved = approved;
        emit Approved(nftContract, tokenId, msg.sender, approved);
    }

    function approveSale(address nftContract, uint256 tokenId) 
        public 
        whenNotPaused 
    {
        require(listings[nftContract][tokenId].isListed, "Token not listed");
          require(!listings[nftContract][tokenId].isAuction, "Cannot approve auctions");
        require(msg.sender == listings[nftContract][tokenId].seller || 
                (listings[nftContract][tokenId].buyer != address(0) && msg.sender == listings[nftContract][tokenId].buyer), 
                "Only seller or buyer can approve");
        require(listings[nftContract][tokenId].isApproved, "Artwork not approved");
        require(listings[nftContract][tokenId].buyerDeposit >= listings[nftContract][tokenId].escrowAmount, 
                "Deposit not met");

        listings[nftContract][tokenId].saleApprover = msg.sender;
        emit Approved(nftContract, tokenId, msg.sender, true);
    }

    function finalizeSale(address nftContract, uint256 tokenId) 
        public 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.isListed, "Token not listed");
        require(!listing.isAuction, "Cannot finalize auctions");
        require(listing.isApproved, "Artwork not approved");
        require(listing.buyerDeposit >= listing.escrowAmount, "Deposit not met");
        require(msg.value >= listing.price, "Insufficient payment");
        require(IERC721(nftContract).ownerOf(tokenId) == address(this), "Token not in escrow");
        require(listing.buyer == address(0) || msg.sender == listing.buyer, "Only designated buyer");
        require(listing.saleApprover != address(0), "Sale not approved by both parties");

        address buyer = listing.buyer != address(0) ? listing.buyer : msg.sender;

        // Pay royalty and seller
        uint256 royaltyAmount = 0;
        address royaltyRecipient = address(0);
        try IERC2981(nftContract).royaltyInfo(tokenId, listing.price) returns (address receiver, uint256 amount) {
            royaltyRecipient = receiver;
            royaltyAmount = amount;
        } catch {}
        uint256 sellerAmount = listing.price - royaltyAmount;

        if (royaltyAmount > 0) {
            (bool success1,) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(success1, "Royalty transfer failed");
            emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        }

        (bool success2,) = payable(listing.seller).call{value: sellerAmount}("");
        require(success2, "Seller transfer failed");

        // Transfer NFT to buyer
        IERC721(nftContract).transferFrom(address(this), buyer, tokenId);

        // Refund excess deposit
        if (listing.buyerDeposit > 0) {
            (bool success3,) = payable(buyer).call{value: listing.buyerDeposit}("");
            require(success3, "Deposit refund failed");
        }

        // Clear listing
        delete listings[nftContract][tokenId];

        emit Purchased(nftContract, tokenId, buyer, listing.price);
    }

    function cancelSale(address nftContract, uint256 tokenId) 
        public 
        nonReentrant 
        whenNotPaused 
    {
         Listing memory listing = listings[nftContract][tokenId];
        require(listing.isListed, "Token not listed");
        require(msg.sender == listing.seller || 
                (!listing.isAuction && listing.buyer != address(0) && msg.sender == listings[nftContract][tokenId].buyer), 
                "Only seller or buyer can cancel");
        require(!listing.isApproved, "Cannot cancel approved artwork");

        if (listing.isAuction) {
            Auction memory auction = auctions[nftContract][tokenId];
            if (auction.highestBidder != address(0)) {
                (bool success,) = auction.highestBidder.call{value: auction.highestBid}("");
                require(success, "Refund failed");
            }
            delete auctions[nftContract][tokenId];
        } else {
            for (uint256 i = 0; i < bids[nftContract][tokenId].length; i++) {
                (bool success,) = bids[nftContract][tokenId][i].bidder.call{value: bids[nftContract][tokenId][i].amount}("");
                require(success, "Refund failed");
            }
            delete bids[nftContract][tokenId];

            if (listing.buyerDeposit > 0) {
                (bool success,) = payable(listing.buyer).call{value: listing.buyerDeposit}("");
                require(success, "Deposit refund failed");
            }
        }

      
        // Return NFT to seller
        IERC721(nftContract).transferFrom(address(this), listing.seller, tokenId);

        // Clear listing
        delete listings[nftContract][tokenId];

        emit Canceled(nftContract, tokenId, msg.sender);
    }

    function extendViewingPeriod(address nftContract, uint256 tokenId, uint256 additionalTime) 
        public 
        onlySeller(nftContract, tokenId) 
        whenNotPaused 
    {
        require(listings[nftContract][tokenId].isListed, "Token not listed");
        require(!listings[nftContract][tokenId].isAuction, "Cannot extend auctions");
        require(additionalTime > 0, "Additional time must be greater than zero");

        listings[nftContract][tokenId].viewingPeriodEnd += additionalTime;
        emit ViewingPeriodUpdated(nftContract, tokenId, listings[nftContract][tokenId].viewingPeriodEnd);
    }

    function getBids(address nftContract, uint256 tokenId) 
        public 
        view 
        returns (Bid[] memory) 
    {
        return bids[nftContract][tokenId];
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