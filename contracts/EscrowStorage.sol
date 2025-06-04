// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./DoArt.sol";

interface IDoArt {
    function mintFor(address to, string memory metadataURI, uint96 royaltyBps) external returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract EscrowStorage is AccessControl {
    uint256 public constant DEFAULT_VIEWING_PERIOD = 3 days;
    uint256 public constant ANTI_SNIPING_EXTENSION = 10 minutes;
    uint256 public constant ANTI_SNIPING_WINDOW = 5 minutes;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Bid {
        address bidder;
        uint256 amount;
    }

    struct Auction {
        uint256 endTime;
        uint256 minBid;
        uint256 minIncrement;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
    }

    struct Listing {
        address nftContract;
        address seller;
        address buyer;
        uint256 price;
        uint256 minBid;
        uint256 escrowAmount;
        uint256 buyerDeposit;
        uint256 viewingPeriodEnd;
        bool isListed;
        bool isApproved;
        address saleApprover;
        bool isAuction;
        uint256 tokenId; // Added tokenId field
    }

    struct LazyMintVoucher {
        uint256 tokenId;
        address creator;
        uint256 price;
        string uri;
        uint96 royaltyBps;
        bytes signature;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;
    mapping(address => mapping(uint256 => Bid[])) public bids;
    mapping(address => mapping(uint256 => Auction)) public auctions;
    mapping(address => mapping(uint256 => bool)) public voucherRedeemed;

    IDoArt public doArt;

    event ListingChanged(address indexed nftContract, uint256 indexed tokenId);
    event BidChanged(address indexed nftContract, uint256 indexed tokenId);
    event AuctionChanged(address indexed nftContract, uint256 indexed tokenId);

    constructor(address _doArtContract) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        doArt = IDoArt(_doArtContract);
    }

    function getTotalNfts() external view returns (uint256) {
        return doArt.totalSupply();
    }

    function getListings() external view returns (Listing[] memory) {
        uint256 totalTokens = doArt.totalSupply();
        Listing[] memory allListings = new Listing[](totalTokens);
        uint256 count = 0;

        for (uint256 tokenId = 1; tokenId <= totalTokens; tokenId++) {
            Listing memory listing = listings[address(doArt)][tokenId];
            if (listing.isListed) {
                listing.tokenId = tokenId; // Set the tokenId in the struct
                allListings[count] = listing;
                count++;
            }
        }

        // Resize array to fit actual number of listings
        Listing[] memory result = new Listing[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allListings[i];
        }

        return result;
    }

    function getListing(address nftContract, uint256 tokenId) external view returns (Listing memory) {
        Listing memory listing = listings[nftContract][tokenId];
        listing.tokenId = tokenId; // Set the tokenId in the returned struct
        return listing;
    }

    function setListing(address nftContract, uint256 tokenId, Listing memory listing) external onlyRole(ADMIN_ROLE) {
        listings[nftContract][tokenId] = listing;
        emit ListingChanged(nftContract, tokenId);
    }

    function deleteListing(address nftContract, uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        delete listings[nftContract][tokenId];
        emit ListingChanged(nftContract, tokenId);
    }

    function getBids(address nftContract, uint256 tokenId) external view returns (Bid[] memory) {
        return bids[nftContract][tokenId];
    }

    function pushBid(address nftContract, uint256 tokenId, Bid memory bid) external onlyRole(ADMIN_ROLE) {
        bids[nftContract][tokenId].push(bid);
        emit BidChanged(nftContract, tokenId);
    }

    function deleteBids(address nftContract, uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        delete bids[nftContract][tokenId];
        emit BidChanged(nftContract, tokenId);
    }

    function getAuction(address nftContract, uint256 tokenId) external view returns (Auction memory) {
        return auctions[nftContract][tokenId];
    }

    function setAuction(address nftContract, uint256 tokenId, Auction memory auction) external onlyRole(ADMIN_ROLE) {
        auctions[nftContract][tokenId] = auction;
        emit AuctionChanged(nftContract, tokenId);
    }

    function deleteAuction(address nftContract, uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        delete auctions[nftContract][tokenId];
        emit AuctionChanged(nftContract, tokenId);
    }

    function getVoucherRedeemed(address nftContract, uint256 tokenId) external view returns (bool) {
        return voucherRedeemed[nftContract][tokenId];
    }

    function setVoucherRedeemed(address nftContract, uint256 tokenId, bool redeemed) external onlyRole(ADMIN_ROLE) {
        voucherRedeemed[nftContract][tokenId] = redeemed;
    }
   
    function getAuctions() external view returns (Auction[] memory) {
        uint256 totalTokens = doArt.totalSupply();
        Auction[] memory allAuctions = new Auction[](totalTokens);
        uint256 count = 0;

        for (uint256 tokenId = 1; tokenId <= totalTokens; tokenId++) {
            Auction memory auction = auctions[address(doArt)][tokenId];
            if (auction.isActive) {
                allAuctions[count] = auction;
                count++;
            }
        }

        Auction[] memory result = new Auction[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allAuctions[i];
        }

        return result;
    }
}