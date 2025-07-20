// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockERC721
 * @dev Mock NFT for testing.
 */
contract MockERC721 is ERC721 {
    constructor() ERC721("MockNFT", "MNFT") {}

    /**
     * @dev Mints a token.
     * @param to Recipient.
     * @param tokenId Token ID.
     */
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}