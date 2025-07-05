const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('EscrowLazyMinting Contract', function () {
  let DoArt, EscrowStorage, EscrowListings, EscrowAuctions, EscrowLazyMinting, MockERC721;
  let doArt, escrowStorage, escrowListings, escrowAuctions, escrowLazyMinting, mockNFT;
  let owner, creator, buyer, other;
  let price, royaltyBps, tokenId, voucher;

  async function createVoucher(tokenId, creator, price, uri, royaltyBps) {
    const domain = {
      name: 'DoArtNFTPlatform',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: escrowLazyMinting.address,
    };
    const types = {
      LazyMintVoucher: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'creator', type: 'address' },
        { name: 'price', type: 'uint256' },
        { name: 'uri', type: 'string' },
        { name: 'royaltyBps', type: 'uint96' },
      ],
    };
    const value = {
      tokenId,
      creator: creator.address,
      price,
      uri: String(uri),
      royaltyBps,
    };
    const signature = await creator._signTypedData(domain, types, value);
    return { tokenId, creator: creator.address, price, uri, royaltyBps, signature };
  }

  beforeEach(async function () {
    [owner, creator, buyer, other] = await ethers.getSigners();
    DoArt = await ethers.getContractFactory('DoArt', owner);
    doArt = await DoArt.deploy(ethers.constants.AddressZero);
    await doArt.deployed();

    EscrowStorage = await ethers.getContractFactory('EscrowStorage', owner);
    escrowStorage = await EscrowStorage.deploy(doArt.address);
    await escrowStorage.deployed();

    await doArt.connect(owner).setStorageContract(escrowStorage.address);

    EscrowAuctions = await ethers.getContractFactory('EscrowAuctions', owner);
    escrowAuctions = await EscrowAuctions.deploy(escrowStorage.address, ethers.constants.AddressZero);
    await escrowAuctions.deployed();

    EscrowLazyMinting = await ethers.getContractFactory('EscrowLazyMinting', owner);
    escrowLazyMinting = await EscrowLazyMinting.deploy(escrowStorage.address);
    await escrowLazyMinting.deployed();

    EscrowListings = await ethers.getContractFactory('EscrowListings', owner);
    escrowListings = await EscrowListings.deploy(escrowStorage.address, escrowAuctions.address);
    await escrowListings.deployed();

    await escrowAuctions.connect(owner).setEscrowListings(escrowListings.address);

    MockERC721 = await ethers.getContractFactory('MockERC721');
    mockNFT = await MockERC721.deploy();
    await mockNFT.deployed();

    const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE'));
    const LISTINGS_CONTRACT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('LISTINGS_CONTRACT'));
    const AUCTIONS_CONTRACT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AUCTIONS_CONTRACT'));
    await escrowStorage.connect(owner).grantRole(ADMIN_ROLE, escrowListings.address);
    await escrowStorage.connect(owner).grantRole(ADMIN_ROLE, escrowAuctions.address);
    await escrowStorage.connect(owner).grantRole(ADMIN_ROLE, escrowLazyMinting.address);
    await escrowStorage.connect(owner).grantRole(LISTINGS_CONTRACT_ROLE, escrowListings.address);
    await escrowStorage.connect(owner).grantRole(AUCTIONS_CONTRACT_ROLE, escrowAuctions.address);

    await doArt.connect(owner).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ARTIST_ROLE')), creator.address);
    await doArt.connect(owner).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), escrowLazyMinting.address);

    price = ethers.utils.parseEther('1');
    royaltyBps = 500;
    tokenId = 1;
    voucher = await createVoucher(tokenId, creator, price, 'https://example.com/nft/1', royaltyBps);
  });

  describe('Role Initialization', function () {
    it('Should set correct roles in constructor', async function () {
      const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('PAUSER_ROLE'));
      expect(await escrowLazyMinting.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe('Pausing', function () {
    it('Should allow pauser to pause and unpause', async function () {
      await escrowLazyMinting.connect(owner).pause();
      expect(await escrowLazyMinting.paused()).to.be.true;
      await escrowLazyMinting.connect(owner).unpause();
      expect(await escrowLazyMinting.paused()).to.be.false;
    });

    it('Should revert if non-pauser tries to pause or unpause', async function () {
      await expect(escrowLazyMinting.connect(other).pause()).to.be.revertedWith(/AccessControl: account/);
      await escrowLazyMinting.connect(owner).pause();
      await expect(escrowLazyMinting.connect(other).unpause()).to.be.revertedWith(/AccessControl: account/);
    });
  });

  describe('Voucher Verification', function () {
    it('Should verify valid voucher signature', async function () {
      const isValid = await escrowLazyMinting.verify(voucher, voucher.signature);
      expect(isValid).to.be.true;
    });

    it('Should revert with invalid signature', async function () {
      const invalidVoucher = await createVoucher(tokenId, other, price, voucher.uri, royaltyBps);
      const isValid = await escrowLazyMinting.verify(voucher, invalidVoucher.signature);
      expect(isValid).to.be.false;
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, {
        ...voucher,
        signature: invalidVoucher.signature
      }, { value: price })).to.be.revertedWith('Invalid signature');
    });
  });

  describe('Redeem Lazy Mint', function () {
    it('Should redeem valid voucher and mint NFT', async function () {
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const royaltyAmount = price.mul(500).div(10000);
      await expect(tx)
        .to.emit(escrowLazyMinting, 'LazyMintRedeemed')
        .withArgs(doArt.address, tokenId, buyer.address, price, creator.address)
        .to.emit(escrowLazyMinting, 'VoucherRedeemed')
        .withArgs(doArt.address, tokenId, true)
        .to.emit(escrowLazyMinting, 'RoyaltyCalculated')
        .withArgs(doArt.address, tokenId, creator.address, royaltyAmount)
        .to.emit(doArt, 'TokenMinted')
        .withArgs(buyer.address, tokenId, voucher.uri);

      const calculatedEvent = receipt.events?.find(e => e.event === 'RoyaltyCalculated');
      expect(calculatedEvent, 'RoyaltyCalculated event should exist').to.exist;
      console.log('RoyaltyCalculated:', {
        recipient: calculatedEvent.args.recipient,
        amount: calculatedEvent.args.amount.toString()
      });

      const royaltyEvent = receipt.events?.find(e => e.event === 'RoyaltyPaid');
      if (royaltyAmount > 0) {
        expect(royaltyEvent, 'RoyaltyPaid event should exist').to.exist;
        expect(royaltyEvent.args.recipient).to.equal(creator.address);
        expect(royaltyEvent.args.amount).to.equal(royaltyAmount);
      } else {
        console.log('Royalty amount is 0, RoyaltyPaid event not emitted');
      }

      expect(await doArt.ownerOf(tokenId)).to.equal(buyer.address);
      expect(await escrowStorage.getVoucherRedeemed(doArt.address, tokenId)).to.be.true;
      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      expect(creatorBalanceAfter).to.be.closeTo(
        creatorBalanceBefore.add(price),
        ethers.utils.parseEther('0.01')
      );
      expect(await doArt.tokenURI(tokenId)).to.equal(voucher.uri);
      const [, , royaltyRecipient, royaltyBpsActual] = await doArt.getTokenDetails(tokenId);
      expect(royaltyRecipient).to.equal(creator.address);
      expect(royaltyBpsActual).to.equal(500);
    });

    it('Should revert if insufficient payment', async function () {
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price.div(2) }))
        .to.be.revertedWith('Insufficient payment');
    });

    it('Should revert if voucher already redeemed', async function () {
      await escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price });
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price }))
        .to.be.revertedWith('Voucher already redeemed');
    });

    it('Should revert if token already minted', async function () {
      await doArt.connect(creator).mint(voucher.uri, royaltyBps);
      expect(await doArt.ownerOf(tokenId)).to.equal(creator.address);
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price }))
        .to.be.revertedWith('Token already minted');
    });

    it('Should revert if contract is paused', async function () {
      await escrowLazyMinting.connect(owner).pause();
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price }))
        .to.be.revertedWith('Pausable: paused');
    });

    it('Should handle non-IERC2981 NFT contract', async function () {
      const mockVoucher = await createVoucher(tokenId, creator, price, 'https://example.com/nft/mock/1', royaltyBps);
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(mockNFT.address, mockVoucher, { value: price }))
        .to.be.revertedWith('Minting failed: Unknown error');
    });

    it('Should refund excess payment', async function () {
      const excessValue = price.add(ethers.utils.parseEther('0.5'));
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      const tx = await escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: excessValue });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalanceAfter).to.be.closeTo(
        buyerBalanceBefore.sub(price).sub(gasUsed),
        ethers.utils.parseEther('0.02')
      );
    });

    it('Should revert if minting fails due to invalid URI', async function () {
      const invalidVoucher = await createVoucher(tokenId, creator, price, 'invalid://uri', royaltyBps);
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, invalidVoucher, { value: price }))
        .to.be.revertedWith('Minting failed: Invalid metadata URI format: must start with https:// or ipfs://');
    });

    it('Should revert if royaltyBps is too high', async function () {
      const invalidVoucher = await createVoucher(tokenId, creator, price, voucher.uri, 20000);
      await expect(escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, invalidVoucher, { value: price }))
        .to.be.revertedWith('Minting failed: Royalty must be <= 100%');
    });
  });

  describe('Royalty Handling', function () {
    it('Should pay royalty correctly', async function () {
      const royaltyAmount = price.mul(500).div(10000);
      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price });
      const receipt = await tx.wait();
      const calculatedEvent = receipt.events?.find(e => e.event === 'RoyaltyCalculated');
      const royaltyEvent = receipt.events?.find(e => e.event === 'RoyaltyPaid');
      expect(calculatedEvent, 'RoyaltyCalculated event should exist').to.exist;
      console.log('RoyaltyCalculated:', {
        recipient: calculatedEvent.args.recipient,
        amount: calculatedEvent.args.amount.toString()
      });
      expect(calculatedEvent.args.recipient).to.equal(creator.address);
      expect(calculatedEvent.args.amount).to.equal(royaltyAmount);
      if (royaltyAmount > 0) {
        expect(royaltyEvent, 'RoyaltyPaid event should exist').to.exist;
        expect(royaltyEvent.args.recipient).to.equal(creator.address);
        expect(royaltyEvent.args.amount).to.equal(royaltyAmount);
      }
      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      expect(creatorBalanceAfter).to.be.closeTo(
        creatorBalanceBefore.add(price),
        ethers.utils.parseEther('0.01')
      );
    });

    it('Should handle zero royalty if royaltyBps is 0', async function () {
      const zeroRoyaltyVoucher = await createVoucher(tokenId, creator, price, voucher.uri, 0);
      const tx = await escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, zeroRoyaltyVoucher, { value: price });
      await expect(tx)
        .to.emit(escrowLazyMinting, 'LazyMintRedeemed')
        .to.emit(escrowLazyMinting, 'RoyaltyCalculated')
        .withArgs(doArt.address, tokenId, ethers.constants.AddressZero, 0)
        .to.not.emit(escrowLazyMinting, 'RoyaltyPaid');
      expect(await doArt.ownerOf(tokenId)).to.equal(buyer.address);
    });

    it('Should verify royalty settings after minting', async function () {
      await escrowLazyMinting.connect(buyer).redeemLazyMint(doArt.address, voucher, { value: price });
      const [recipient, amount] = await doArt.debugRoyaltyInfo(tokenId, price);
      console.log('DebugRoyaltyInfo:', { recipient, amount: amount.toString() });
      expect(recipient).to.equal(creator.address);
      expect(amount).to.equal(price.mul(500).div(10000));
    });
  });
});