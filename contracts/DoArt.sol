// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";


contract DoArt is ERC721URIStorage, ERC721Royalty, AccessControl, Pausable {
    
    using Counters for Counters.Counter;  
    Counters.Counter private _tokenIds;
  

    // Define roles for access control
    bytes32 public constant ARTIST_ROLE = keccak256("ARTIST_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Struct for artist metadata
    struct ArtistMetadata {
        string name;
        string bio;
        string portfolioUrl;
    }

    // Mapping to store artist metadata
    mapping(address => ArtistMetadata) private _artistMetadata;

    event TokenMinted(address indexed owner, uint256 indexed tokenId, string metadataURI);
    event TokenBurned(uint256 indexed tokenId);
    event ArtistMetadataUpdated(address indexed artist, string name, string bio, string portfolioUrl);
   

    constructor() ERC721("DoArt", "DA") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ARTIST_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
    }
    function setArtistMetadata(string memory name, string memory bio, string memory portfolioUrl)
        public
        whenNotPaused
    {
        require(hasRole(ARTIST_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not artist or admin");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(name).length <= 50, "Name too long");
        require(bytes(bio).length <= 500, "Bio too long");
        require(bytes(portfolioUrl).length <= 200, "Portfolio URL too long");
        require(isValidUrl(portfolioUrl), "Invalid portfolio URL format: must start with https:// or ipfs://");

        _artistMetadata[msg.sender] = ArtistMetadata(name, bio, portfolioUrl);
        emit ArtistMetadataUpdated(msg.sender, name, bio, portfolioUrl);
    }

    function getArtistMetadata(address artist)
        public
        view
        returns (string memory name, string memory bio, string memory portfolioUrl)
    {
        ArtistMetadata memory metadata = _artistMetadata[artist];
        return (metadata.name, metadata.bio, metadata.portfolioUrl);
    }

    function mint(string memory metadataURI, uint96 royaltyBps) 
    public 
    onlyRole
    (ARTIST_ROLE)
     whenNotPaused 
     returns (uint256)
      {
        require(bytes(metadataURI).length > 0, "Token URI cannot be empty"); 
        require(isValidTokenURI(metadataURI), "Invalid metadata URI format: must start with https:// or ipfs://");
        require(bytes(metadataURI).length <= 200, "Token URI too long");
        require(royaltyBps <= 10000, "Royalty must be <= 100%");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, metadataURI);
        _setTokenRoyalty(newItemId, msg.sender, royaltyBps); 

        emit TokenMinted(msg.sender, newItemId, metadataURI);

        return newItemId;
    }

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
            require(bytes(metadataURIs[i]).length > 0, "Metadata URI cannot be empty");
            require(isValidTokenURI(metadataURIs[i]), "Invalid metadata URI format: must start with https:// or ipfs://");
            require(bytes(metadataURIs[i]).length <= 200, "Metadata URI too long");
            require(royaltyBps[i] <= 10000, "Royalty must be <= 100%");

            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _mint(msg.sender, newItemId);
            _setTokenURI(newItemId, metadataURIs[i]);
            _setTokenRoyalty(newItemId, msg.sender, royaltyBps[i]);

            emit TokenMinted(msg.sender, newItemId, metadataURIs[i]);
            tokenIds[i] = newItemId;
        }

        return tokenIds;
    }

     function burn(uint256 tokenId)
        public
        whenNotPaused
    {
        require(_exists(tokenId), "Token does not exist");
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");

        _burn(tokenId);
        emit TokenBurned(tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
  
     
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

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

    
    function getTokenDetails(uint256 tokenId)
        public
        view
        returns (address owner, string memory uri, address royaltyRecipient, uint256 royaltyBps)
    {
        require(_exists(tokenId), "Token does not exist");
        (address recipient, uint256 royaltyAmount) = royaltyInfo(tokenId, 10000); // Sale price of 10000 wei
        uint256 bps = royaltyAmount;
        return (ownerOf(tokenId), tokenURI(tokenId), recipient, bps);
    }

    function isValidTokenURI(string memory uri) internal pure returns (bool) {
        bytes memory uriBytes = bytes(uri);
        // Check for https:// (length >= 8) or ipfs:// (length >= 7)
        if (uriBytes.length < 7) {
            return false;
        }

        // Check prefix using a simple byte comparison
        bytes memory httpsPrefix = bytes("https://");
        bytes memory ipfsPrefix = bytes("ipfs://");

        bool isHttps = true;
        bool isIpfs = true;

        // Compare with https://
        if (uriBytes.length >= 8) {
            for (uint256 i = 0; i < 8; i++) {
                if (uriBytes[i] != httpsPrefix[i]) {
                    isHttps = false;
                    break;
                }
            }
        } else {
            isHttps = false;
        }

        // Compare with ipfs://
        for (uint256 i = 0; i < 7; i++) {
            if (uriBytes[i] != ipfsPrefix[i]) {
                isIpfs = false;
                break;
            }
        }

        return isHttps || isIpfs;
    }
    function isValidUrl(string memory uri) internal pure returns (bool) {
        return isValidTokenURI(uri); // Reuse isValidTokenURI for consistency
    }

     // Allow admin to update royalties for a token (optional)
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 royaltyBps) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");
        require(royaltyBps <= 10000, "Royalty must be <= 100%");
        _setTokenRoyalty(tokenId, recipient, royaltyBps);
    }

    // Override _burn to resolve conflict between ERC721URIStorage and ERC721Royalty
    function _burn(uint256 tokenId) internal override( ERC721URIStorage, ERC721Royalty) {
        super._burn(tokenId);
    }

     // Override tokenURI to resolve conflict between ERC721URIStorage and ERC721
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



