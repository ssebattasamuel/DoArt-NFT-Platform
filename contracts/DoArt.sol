// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./EscrowStorage.sol";

/**
 * @title DoArt NFT Contract
 * @dev ERC721 contract for minting and managing digital art NFTs with royalties and artist metadata.
 */
contract DoArt is ERC721URIStorage, ERC721Royalty, AccessControl, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    EscrowStorage public storageContract;

    bytes32 public constant ARTIST_ROLE = keccak256("ARTIST_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct ArtistMetadata {
        string name;
        string bio;
        string portfolioUrl;
    }

    mapping(address => ArtistMetadata) private _artistMetadata;

    event TokenMinted(address indexed owner, uint256 indexed tokenId, string metadataURI);
    event TokenBurned(uint256 indexed tokenId);
    event ArtistMetadataUpdated(address indexed artist, string name, string bio, string portfolioUrl);
    event DebugRoyaltySet(uint256 indexed tokenId, address recipient, uint96 royaltyBps);

    /**
     * @dev Constructor to initialize the contract.
     * @param _storageContract Address of the EscrowStorage contract.
     */
    constructor(address _storageContract) ERC721("DoArt", "DA") {
        storageContract = EscrowStorage(_storageContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARTIST_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Sets the storage contract address.
     * @param _storageContract New storage contract address.
     */
    function setStorageContract(address _storageContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_storageContract != address(0), "Invalid address");
        storageContract = EscrowStorage(_storageContract);
    }

    /**
     * @dev Sets metadata for an artist.
     * @param name Artist's name.
     * @param bio Artist's bio.
     * @param portfolioUrl Artist's portfolio URL.
     */
    function setArtistMetadata(string memory name, string memory bio, string memory portfolioUrl)
        public
        whenNotPaused
    {
        require(hasRole(ARTIST_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not artist or admin");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(name).length <= 50, "Name too long");
        require(bytes(bio).length <= 500, "Bio too long");
        require(bytes(portfolioUrl).length <= 200, "Portfolio URL too long");
        require(_isValidUrl(portfolioUrl), "Invalid portfolio URL format: must start with https:// or ipfs://");

        _artistMetadata[msg.sender] = ArtistMetadata(name, bio, portfolioUrl);
        emit ArtistMetadataUpdated(msg.sender, name, bio, portfolioUrl);
    }

    /**
     * @dev Gets metadata for an artist.
     * @param artist Artist's address.
     * @return name Artist's name.
     * @return bio Artist's bio.
     * @return portfolioUrl Artist's portfolio URL.
     */
    function getArtistMetadata(address artist)
        public
        view
        returns (string memory name, string memory bio, string memory portfolioUrl)
    {
        ArtistMetadata memory metadata = _artistMetadata[artist];
        return (metadata.name, metadata.bio, metadata.portfolioUrl);
    }

    /**
     * @dev Mints a new token with royalty.
     * @param metadataURI URI for token metadata.
     * @param royaltyBps Royalty basis points.
     * @return tokenId Minted token ID.
     */
    function mint(string memory metadataURI, uint96 royaltyBps)
        public
        onlyRole(ARTIST_ROLE)
        whenNotPaused
        returns (uint256)
    {
        return _mintWithRoyalty(msg.sender, metadataURI, msg.sender, royaltyBps);
    }

    /**
     * @dev Mints a token for a specified address.
     * @param to Recipient address.
     * @param metadataURI URI for token metadata.
     * @param royaltyRecipient Royalty recipient.
     * @param royaltyBps Royalty basis points.
     * @return tokenId Minted token ID.
     */
    function mintFor(address to, string memory metadataURI, address royaltyRecipient, uint96 royaltyBps)
        public
        onlyRole(MINTER_ROLE)
        whenNotPaused
        returns (uint256)
    {
        return _mintWithRoyalty(to, metadataURI, royaltyRecipient, royaltyBps);
    }

    function _mintWithRoyalty(address to, string memory metadataURI, address royaltyRecipient, uint96 royaltyBps)
        internal
        returns (uint256)
    {
        _validateMintInputs(metadataURI, royaltyBps);
        uint256 newItemId = _createToken(to);
        _setTokenMetadata(newItemId, metadataURI, royaltyRecipient, royaltyBps);
        emit TokenMinted(to, newItemId, metadataURI);
        return newItemId;
    }

    /**
     * @dev Batch mints tokens.
     * @param metadataURIs Array of metadata URIs.
     * @param royaltyBps Array of royalty basis points.
     * @return tokenIds Array of minted token IDs.
     */
    function batchMint(string[] memory metadataURIs, uint96[] memory royaltyBps)
        public
        onlyRole(ARTIST_ROLE)
        whenNotPaused
        returns (uint256[] memory)
    {
        require(metadataURIs.length > 0, "No metadata URIs provided");
        require(metadataURIs.length == royaltyBps.length, "Mismatched array lengths");
        require(metadataURIs.length <= 50, "Batch size exceeds limit");

        uint256[] memory tokenIds = new uint256[](metadataURIs.length);
        for (uint256 i = 0; i < metadataURIs.length; i++) {
            tokenIds[i] = _mintSingle(msg.sender, metadataURIs[i], msg.sender, royaltyBps[i]);
        }
        return tokenIds;
    }

    /**
     * @dev Burns a token.
     * @param tokenId Token ID to burn.
     */
    function burn(uint256 tokenId)
        public
        whenNotPaused
    {
        require(_exists(tokenId), "Token does not exist");
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");

        _burn(tokenId);
        emit TokenBurned(tokenId);
    }

    /**
     * @dev Returns total supply of tokens.
     * @return Total token count.
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev Pauses the contract.
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract.
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Gets tokens owned by an address.
     * @param owner Owner address.
     * @return tokenIds Array of token IDs.
     */
    function getTokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }
        return tokenIds;
    }

    /**
     * @dev Gets details of a token.
     * @param tokenId Token ID.
     * @return owner Token owner.
     * @return uri Token URI.
     * @return royaltyRecipient Royalty recipient.
     * @return royaltyBps Royalty basis points.
     */
    function getTokenDetails(uint256 tokenId)
        public
        view
        returns (address owner, string memory uri, address royaltyRecipient, uint256 royaltyBps)
    {
        require(_exists(tokenId), "Token does not exist");
        (address recipient, uint256 royaltyAmount) = royaltyInfo(tokenId, 10000);
        uint256 bps = royaltyAmount;
        return (ownerOf(tokenId), tokenURI(tokenId), recipient, bps);
    }

    /**
     * @dev Sets royalty for a token.
     * @param tokenId Token ID.
     * @param recipient Royalty recipient.
     * @param royaltyBps Royalty basis points.
     */
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyBps)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_exists(tokenId), "Token does not exist");
        require(royaltyBps <= 10000, "Royalty must be <= 100%");
        _setTokenRoyalty(tokenId, recipient, royaltyBps);
        emit DebugRoyaltySet(tokenId, recipient, royaltyBps);
    }

    /**
     * @dev Debug function for royalty info.
     * @param tokenId Token ID.
     * @param salePrice Sale price.
     * @return recipient Royalty recipient.
     * @return amount Royalty amount.
     */
    function debugRoyaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address recipient, uint256 amount)
    {
        return royaltyInfo(tokenId, salePrice);
    }

    function _validateMintInputs(string memory uri, uint96 royaltyBps) internal pure {
        require(bytes(uri).length > 0, "Token URI cannot be empty");
        require(_isValidUrl(uri), "Invalid metadata URI format: must start with https:// or ipfs://");
        require(bytes(uri).length <= 200, "Token URI too long");
        require(royaltyBps <= 10000, "Royalty must be <= 100%");
    }

    function _createToken(address to) internal returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(to, newItemId);
        return newItemId;
    }

    function _setTokenMetadata(uint256 tokenId, string memory metadataURI, address royaltyRecipient, uint96 royaltyBps) internal {
        _setTokenURI(tokenId, metadataURI);
        if (royaltyBps > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipient, royaltyBps);
            emit DebugRoyaltySet(tokenId, royaltyRecipient, royaltyBps);
        }
    }

    function _mintSingle(address to, string memory metadataURI, address royaltyRecipient, uint96 royaltyBps) internal returns (uint256) {
        _validateMintInputs(metadataURI, royaltyBps);
        uint256 newItemId = _createToken(to);
        _setTokenMetadata(newItemId, metadataURI, royaltyRecipient, royaltyBps);
        emit TokenMinted(to, newItemId, metadataURI);
        return newItemId;
    }

    /**
     * @dev Validates if URL starts with https:// or ipfs://.
     * @param uri URI to validate.
     * @return True if valid.
     */
    function _isValidUrl(string memory uri) internal pure returns (bool) {
        bytes memory u = bytes(uri);
        if (u.length >= 8) {
            bytes8 prefix8 = bytes8(u[0]) | (bytes8(u[1]) >> 8) | (bytes8(u[2]) >> 16) | (bytes8(u[3]) >> 24) |
                             (bytes8(u[4]) >> 32) | (bytes8(u[5]) >> 40) | (bytes8(u[6]) >> 48) | (bytes8(u[7]) >> 56);
            if (prefix8 == bytes8("https://")) return true;
        }
        if (u.length >= 7) {
            bytes7 prefix7 = bytes7(u[0]) | (bytes7(u[1]) >> 8) | (bytes7(u[2]) >> 16) | (bytes7(u[3]) >> 24) |
                             (bytes7(u[4]) >> 32) | (bytes7(u[5]) >> 40) | (bytes7(u[6]) >> 48);
            if (prefix7 == bytes7("ipfs://")) return true;
        }
        return false;
    }

    function _burn(uint256 tokenId) internal override(ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC721Royalty, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}