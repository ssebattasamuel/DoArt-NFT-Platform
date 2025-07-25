// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./EscrowStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EscrowLazyMinting Contract
 * @dev Handles lazy minting of NFTs using vouchers.
 */
contract EscrowLazyMinting is ReentrancyGuard, Pausable, AccessControl {
    EscrowStorage public storageContract;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event LazyMintRedeemed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price,
        address creator
    );
    event RoyaltyPaid(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );
    event VoucherRedeemed(
        address indexed nftContract,
        uint256 indexed tokenId,
        bool redeemed
    );
    event RoyaltyCalculated(
        address indexed nftContract,
        uint256 indexed tokenId,
        address recipient,
        uint256 amount
    );

    /**
     * @dev Constructor.
     * @param _storageContract Storage address.
     */
    constructor(address _storageContract) {
        storageContract = EscrowStorage(_storageContract);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Redeems a lazy mint voucher.
     * @param nftContract NFT contract.
     * @param voucher The lazy mint voucher.
     */
    function redeemLazyMint(address nftContract, EscrowStorage.LazyMintVoucher calldata voucher) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value >= voucher.price, "Insufficient payment");
        require(!storageContract.getVoucherRedeemed(nftContract, voucher.tokenId), "Voucher already redeemed");
        _verifyVoucher(voucher);
        address buyer = msg.sender;
        _checkTokenNotMinted(nftContract, voucher.tokenId);
        _mintLazy(nftContract, buyer, voucher);
        _executePayments(nftContract, voucher.tokenId, voucher.price, voucher.creator);
        storageContract.setVoucherRedeemed(nftContract, voucher.tokenId, true);
        emit VoucherRedeemed(nftContract, voucher.tokenId, true);
        emit LazyMintRedeemed(nftContract, voucher.tokenId, buyer, voucher.price, voucher.creator);
        if (msg.value > voucher.price) {
            uint256 refundAmount = msg.value - voucher.price;
            _transferETH(buyer, refundAmount);
        }
    }

    /**
     * @dev Verifies a voucher signature.
     * @param voucher Voucher to verify.
     * @param signature Signature.
     * @return True if valid.
     */
    function verify(EscrowStorage.LazyMintVoucher calldata voucher, bytes calldata signature) 
        public 
        view 
        returns (bool) 
    {
        bytes32 hash = _hashVoucher(voucher);
        address signer = ECDSA.recover(hash, signature);
        return signer == voucher.creator;
    }

    function mintFor(address nftContract, address to, EscrowStorage.LazyMintVoucher calldata voucher) 
        internal 
    {
        try IDoArt(nftContract).mintFor(to, voucher.uri, voucher.creator, voucher.royaltyBps) {
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Minting failed: ", reason)));
        } catch {
            revert("Minting failed: Unknown error");
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
        emit RoyaltyCalculated(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        uint256 creatorAmount = price - royaltyAmount;
        if (royaltyAmount > 0) {
            (bool royaltySuccess, ) = payable(royaltyRecipient).call{value: royaltyAmount}("");
            require(royaltySuccess, "Royalty payment failed");
            emit RoyaltyPaid(nftContract, tokenId, royaltyRecipient, royaltyAmount);
        }
        (bool creatorSuccess, ) = payable(creator).call{value: creatorAmount}("");
        require(creatorSuccess, "Creator payment failed");
    }

    function _mintLazy(address nftContract, address to, EscrowStorage.LazyMintVoucher calldata voucher) internal {
        mintFor(nftContract, to, voucher);
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

    /** @dev Internal ETH transfer.
     * @param to Recipient.
     * @param amount Amount.
     */
    function _transferETH(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "ETH transfer failed");
    }
}