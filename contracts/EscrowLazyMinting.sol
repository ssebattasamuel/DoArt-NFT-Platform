// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract EscrowLazyMinting {
    EscrowStorage public storageContract;
    bool private locked;

    event Action(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint8 actionType,
        address indexed user,
        uint256 value
    );

    constructor(address _storageContract) {
        storageContract = EscrowStorage(_storageContract);
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function redeemLazyMint(address nftContract, EscrowStorage.LazyMintVoucher calldata voucher) external payable nonReentrant {
        require(msg.value >= voucher.price, "Insufficient payment");
        _verifyVoucher(voucher);
        _checkTokenNotMinted(nftContract, voucher.tokenId);
        address buyer = msg.sender;
        _executePayments(nftContract, voucher.tokenId, voucher.price, voucher.creator);
        _mintLazy(nftContract, buyer, voucher);
        emit Action(nftContract, voucher.tokenId, 10, buyer, voucher.price);
    }

    function mintFor(address nftContract, address to, EscrowStorage.LazyMintVoucher calldata voucher) external {
        require(msg.sender == address(this), "Only callable by contract");
        try IDoArt(nftContract).mintFor(to, voucher.uri, voucher.royaltyBps) returns (uint256 tokenId) {
            require(tokenId == voucher.tokenId, "Minted token ID does not match voucher");
        } catch {
            revert("Minting failed");
        }
    }

    function _verifyVoucher(EscrowStorage.LazyMintVoucher calldata voucher) internal view {
        bytes32 hash = _hashVoucher(voucher);
        address signer = ECDSA.recover(hash, voucher.signature);
        require(signer == voucher.creator, "Invalid signature");
    }

    function _checkTokenNotMinted(address nftContract, uint256 tokenId) internal view {
        try IERC721(nftContract).ownerOf(tokenId) {
            revert("Token already minted");
        } catch {}
    }

    function _executePayments(address nftContract, uint256 tokenId, uint256 price, address creator) internal {
        (address royaltyRecipient, uint256 royaltyAmount) = _calculateRoyalty(nftContract, tokenId, price);
        uint256 creatorAmount = price - royaltyAmount;
        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
            emit Action(nftContract, tokenId, 2, royaltyRecipient, royaltyAmount);
        }
        payable(creator).transfer(creatorAmount);
    }

    function _mintLazy(address nftContract, address to, EscrowStorage.LazyMintVoucher calldata voucher) internal {
        try this.mintFor(nftContract, to, voucher) {
        } catch {
            revert("Minting failed");
        }
    }

    function _hashVoucher(EscrowStorage.LazyMintVoucher calldata voucher) internal view returns (bytes32) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("DoArtNFTPlatform")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("LazyMintVoucher(uint256 tokenId,address creator,uint256 price,string uri,uint96 royaltyBps)"),
                voucher.tokenId,
                voucher.creator,
                voucher.price,
                keccak256(bytes(voucher.uri)),
                voucher.royaltyBps
            )
        );
        return ECDSA.toTypedDataHash(domainSeparator, structHash);
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
}