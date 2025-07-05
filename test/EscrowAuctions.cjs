
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('EscrowAuctions Contract', function () {
  let DoArt, EscrowStorage, EscrowListings, EscrowAuctions, EscrowLazyMinting;
  let doArt, escrowStorage, escrowListings, escrowAuctions, escrowLazyMinting;
  let owner, seller, buyer, other;
  let price, minBid, escrowAmount, auctionDuration;

  beforeEach(async function () {
    // Get signers
    [owner, seller, buyer, other] = await ethers.getSigners();

    // Deploy DoArt with AddressZero as placeholder
    DoArt = await ethers.getContractFactory('DoArt', owner);
    doArt = await DoArt.deploy(ethers.constants.AddressZero);
    await doArt.deployed();

    // Deploy EscrowStorage with DoArt address
    EscrowStorage = await ethers.getContractFactory('EscrowStorage', owner);
    escrowStorage = await EscrowStorage.deploy(doArt.address);
    await escrowStorage.deployed();

    // Update DoArt with EscrowStorage address
    await doArt.connect(owner).setStorageContract(escrowStorage.address);

    // Deploy EscrowAuctions with placeholder for EscrowListings
    EscrowAuctions = await ethers.getContractFactory('EscrowAuctions', owner);
    escrowAuctions = await EscrowAuctions.deploy(escrowStorage.address, ethers.constants.AddressZero);
    await escrowAuctions.deployed();

    // Deploy EscrowLazyMinting
    EscrowLazyMinting = await ethers.getContractFactory('EscrowLazyMinting', owner);
    escrowLazyMinting = await EscrowLazyMinting.deploy(escrowStorage.address);
    await escrowLazyMinting.deployed();

    // Deploy EscrowListings
    EscrowListings = await ethers.getContractFactory('EscrowListings', owner);
    escrowListings = await EscrowListings.deploy(escrowStorage.address, escrowAuctions.address);
    await escrowListings.deployed();

    // Update EscrowAuctions with EscrowListings address
    await escrowAuctions.connect(owner).setEscrowListings(escrowListings.address);

    // Grant roles to EscrowListings and EscrowAuctions in EscrowStorage
    const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE'));
    const LISTINGS_CONTRACT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('LISTINGS_CONTRACT'));
    const AUCTIONS_CONTRACT_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('AUCTIONS_CONTRACT'));
    await escrowStorage.connect(owner).grantRole(ADMIN_ROLE, escrowListings.address);
    await escrowStorage.connect(owner).grantRole(ADMIN_ROLE, escrowAuctions.address);
    await escrowStorage.connect(owner).grantRole(LISTINGS_CONTRACT_ROLE, escrowListings.address);
    await escrowStorage.connect(owner).grantRole(AUCTIONS_CONTRACT_ROLE, escrowAuctions.address);

    // Grant ARTIST_ROLE to seller for minting
    await doArt.connect(owner).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ARTIST_ROLE')), seller.address);

    // Mint an NFT for seller
    await doArt.connect(seller).mint('https://example.com/nft/1', 500); // 5% royalty
    await doArt.connect(seller).setApprovalForAll(escrowListings.address, true);

    // Set up listing parameters
    price = ethers.utils.parseEther('1');
    minBid = ethers.utils.parseEther('0.5');
    escrowAmount = ethers.utils.parseEther('0.1');
    auctionDuration = 86400; // 1 day

    // List NFT as auction
    await escrowListings
      .connect(seller)
      .list(
        doArt.address,
        1,
        buyer.address,
        price,
        minBid,
        escrowAmount,
        true,
        auctionDuration
      );

    // Log auction setup
    const auction = await escrowStorage.getAuction(doArt.address, 1);
    const block = await ethers.provider.getBlock('latest');
    console.log('Auction setup - endTime:', auction.endTime.toString());
    console.log('Auction setup - expected endTime:', (block.timestamp + auctionDuration).toString());
  });

  describe('Role Initialization', function () {
    it('Should set correct roles in constructor', async function () {
      const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('PAUSER_ROLE'));
      expect(await escrowAuctions.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
      expect(await escrowAuctions.owner()).to.equal(owner.address);
    });
  });

  describe('Pausing', function () {
    it('Should allow pauser to pause and unpause', async function () {
      await escrowAuctions.connect(owner).pause();
      expect(await escrowAuctions.paused()).to.be.true;
      await escrowAuctions.connect(owner).unpause();
      expect(await escrowAuctions.paused()).to.be.false;
    });

    it('Should revert if non-pauser tries to pause or unpause', async function () {
      await expect(escrowAuctions.connect(other).pause()).to.be.revertedWith(/AccessControl: account/);
      await escrowAuctions.connect(owner).pause();
      await expect(escrowAuctions.connect(other).unpause()).to.be.revertedWith(/AccessControl: account/);
    });
  });

  describe('Batch Place Auction Bid', function () {
    it('Should allow batch bidding on auctions', async function () {
      const tokenIds = [1];
      const amounts = [ethers.utils.parseEther('0.6')];
      const totalValue = amounts.reduce((sum, val) => sum.add(val), ethers.BigNumber.from(0));

      await expect(
        escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: totalValue })
      )
        .to.emit(escrowAuctions, 'BatchBidPlaced')
        .withArgs(doArt.address, tokenIds, buyer.address, amounts)
        .to.emit(escrowAuctions, 'BidPlaced')
        .withArgs(doArt.address, 1, buyer.address, amounts[0]);

      const auction = await escrowStorage.getAuction(doArt.address, 1);
      expect(auction.highestBidder).to.equal(buyer.address);
      expect(auction.highestBid).to.equal(amounts[0]);
    });

    it('Should revert if insufficient payment', async function () {
      const tokenIds = [1];
      const amounts = [ethers.utils.parseEther('0.6')];
      await expect(
        escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: ethers.utils.parseEther('0.5') })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('Should revert if token not listed', async function () {
      const tokenIds = [2]; // Non-existent token
      const amounts = [ethers.utils.parseEther('0.6')];
      await expect(
        escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: amounts[0] })
      ).to.be.revertedWith('Token not listed');
    });

    it('Should revert if not an auction', async function () {
      await doArt.connect(seller).mint('https://example.com/nft/2', 500);
      await doArt.connect(seller).setApprovalForAll(escrowListings.address, true);
      await escrowListings
        .connect(seller)
        .list(doArt.address, 2, buyer.address, price, minBid, escrowAmount, false, 0);

      const tokenIds = [2];
      const amounts = [ethers.utils.parseEther('0.6')];
      await expect(
        escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: amounts[0] })
      ).to.be.revertedWith('Not an auction');
    });

    it('Should revert if bid is too low', async function () {
      const tokenIds = [1];
      const amounts = [ethers.utils.parseEther('0.4')]; // Below minBid
      await expect(
        escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: amounts[0] })
      ).to.be.revertedWith('Bid too low');
    });

    // it('Should extend auction if bid is within anti-sniping window', async function () {
    //   const tokenIds = [1];
    //   const amounts = [ethers.utils.parseEther('0.6')];
    //   const block = await ethers.provider.getBlock('latest');
    //   const currentTime = block.timestamp;

    //   // Log auction setup
    //   const auctionBeforeSetup = await escrowStorage.getAuction(doArt.address, 1);
    //   console.log('Auction setup - endTime:', auctionBeforeSetup.endTime.toString());
    //   console.log('Auction setup - expected endTime:', (currentTime + auctionDuration).toString());

    //   await ethers.provider.send('evm_increaseTime', [auctionDuration - 300]);
    //   await ethers.provider.send('evm_mine');

    //   // Log before bid
    //   const auctionBefore = await escrowStorage.getAuction(doArt.address, 1);
    //   console.log('Before bid - auction.endTime:', auctionBefore.endTime.toString());

    //   const tx = await escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: amounts[0] });
    //   const receipt = await tx.wait();
    //   const txBlock = await ethers.provider.getBlock(receipt.blockNumber);
    //   const blockTimestamp = txBlock.timestamp;
    //   console.log('After bid - blockTimestamp:', blockTimestamp);

    //   // Log DebugTimestamp event
    //   const debugEvent = receipt.events?.find(e => e.event === 'DebugTimestamp');
    //   console.log('DebugTimestamp:', {
    //     blockTimestamp: debugEvent?.args?.blockTimestamp?.toString(),
    //     auctionEndTime: debugEvent?.args?.auctionEndTime?.toString(),
    //     antiSnipingWindow: debugEvent?.args?.antiSnipingWindow?.toString(),
    //     isWithinWindow: debugEvent?.args?.isWithinWindow
    //   });

    //   const expectedEndTime = blockTimestamp + 600; // ANTI_SNIPING_EXTENSION = 600 seconds
    //   await expect(tx)
    //     .to.emit(escrowAuctions, 'AuctionExtended')
    //     .withArgs(doArt.address, 1, expectedEndTime);

    //   const auction = await escrowStorage.getAuction(doArt.address, 1);
    //   console.log('After bid - auction.endTime:', auction.endTime.toString());
    //   console.log('After bid - expectedEndTime:', expectedEndTime.toString());
    //   expect(auction.endTime).to.be.closeTo(expectedEndTime, 1);
    // });
    it('Should extend auction if bid is within anti-sniping window', async function () {
  const tokenIds = [1];
  const amounts = [ethers.utils.parseEther('0.6')];
  await ethers.provider.send('evm_increaseTime', [auctionDuration - 300]);
  await ethers.provider.send('evm_mine');

  const tx = await escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, tokenIds, amounts, { value: amounts[0] });
  const receipt = await tx.wait();
  const txBlock = await ethers.provider.getBlock(receipt.blockNumber);
  const blockTimestamp = txBlock.timestamp;

  const expectedEndTime = blockTimestamp + 600; // ANTI_SNIPING_EXTENSION = 600 seconds
  await expect(tx)
    .to.emit(escrowAuctions, 'AuctionExtended')
    .withArgs(doArt.address, 1, expectedEndTime);

  const auction = await escrowStorage.getAuction(doArt.address, 1);
  expect(auction.endTime).to.be.closeTo(expectedEndTime, 1);
});
  });

  describe('End Auction', function () {
    it('Should finalize auction with highest bidder', async function () {
      const bidAmount = ethers.utils.parseEther('0.6');
      await escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, [1], [bidAmount], { value: bidAmount });

      await ethers.provider.send('evm_increaseTime', [auctionDuration + 1]);
      await ethers.provider.send('evm_mine');

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      await expect(escrowAuctions.endAuction(doArt.address, 1))
        .to.emit(escrowAuctions, 'AuctionFinalized')
        .withArgs(doArt.address, 1, seller.address, buyer.address, bidAmount)
        .to.emit(doArt, 'Transfer')
        .withArgs(escrowListings.address, buyer.address, 1);

      expect(await doArt.ownerOf(1)).to.equal(buyer.address);
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore); // Seller received payment
    });

    it('Should cancel auction if no bids', async function () {
      await ethers.provider.send('evm_increaseTime', [auctionDuration + 1]);
      await ethers.provider.send('evm_mine');

      await expect(escrowAuctions.endAuction(doArt.address, 1))
        .to.emit(escrowAuctions, 'AuctionCanceled')
        .withArgs(doArt.address, 1, owner.address)
        .to.emit(doArt, 'Transfer')
        .withArgs(escrowListings.address, seller.address, 1);

      expect(await doArt.ownerOf(1)).to.equal(seller.address);
    });

    it('Should revert if auction not ended', async function () {
      await expect(escrowAuctions.endAuction(doArt.address, 1)).to.be.revertedWith('Auction not yet ended');
    });

    it('Should revert if token not listed', async function () {
      await expect(escrowAuctions.endAuction(doArt.address, 2)).to.be.revertedWith('Token not listed');
    });

    it('Should revert if not an auction', async function () {
      await doArt.connect(seller).mint('https://example.com/nft/2', 500);
      await doArt.connect(seller).setApprovalForAll(escrowListings.address, true);
      await escrowListings
        .connect(seller)
        .list(doArt.address, 2, buyer.address, price, minBid, escrowAmount, false, 0);

      await expect(escrowAuctions.endAuction(doArt.address, 2)).to.be.revertedWith('Not an auction');
    });
  });

  describe('Cancel Sale', function () {
    it('Should allow seller to cancel auction', async function () {
      await expect(escrowAuctions.connect(seller).cancelSale(doArt.address, 1))
        .to.emit(escrowAuctions, 'AuctionCanceled')
        .withArgs(doArt.address, 1, seller.address)
        .to.emit(doArt, 'Transfer')
        .withArgs(escrowListings.address, seller.address, 1);

      expect(await doArt.ownerOf(1)).to.equal(seller.address);
    });

    it('Should allow buyer to cancel auction with no bids', async function () {
      await expect(escrowAuctions.connect(buyer).cancelSale(doArt.address, 1))
        .to.emit(escrowAuctions, 'AuctionCanceled')
        .withArgs(doArt.address, 1, buyer.address)
        .to.emit(doArt, 'Transfer')
        .withArgs(escrowListings.address, seller.address, 1);

      expect(await doArt.ownerOf(1)).to.equal(seller.address);
    });

    it('Should revert if buyer tries to cancel with bids', async function () {
      await escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, [1], [minBid], { value: minBid });
      await expect(escrowAuctions.connect(buyer).cancelSale(doArt.address, 1)).to.be.revertedWith('Only seller or buyer with no bids can cancel');
    });

    it('Should revert if non-seller/non-buyer tries to cancel', async function () {
      await expect(escrowAuctions.connect(other).cancelSale(doArt.address, 1)).to.be.revertedWith('Only seller or buyer with no bids can cancel');
    });
  });

  describe('Royalty Handling', function () {
    it('Should pay royalty when finalizing auction', async function () {
      const bidAmount = ethers.utils.parseEther('1');
      await escrowAuctions.connect(buyer).batchPlaceAuctionBid(doArt.address, [1], [bidAmount], { value: bidAmount });

      await ethers.provider.send('evm_increaseTime', [auctionDuration + 1]);
      await ethers.provider.send('evm_mine');

      const royaltyRecipient = seller.address; // Seller set as royalty recipient in mint
      const royaltyAmount = bidAmount.mul(500).div(10000); // 5% royalty

      await expect(escrowAuctions.endAuction(doArt.address, 1))
        .to.emit(escrowAuctions, 'RoyaltyPaid')
        .withArgs(doArt.address, 1, royaltyRecipient, royaltyAmount);

      expect(await doArt.ownerOf(1)).to.equal(buyer.address);
    });

    it('Should handle no royalty for non-IERC2981 NFT', async function () {
      const MockERC721 = await ethers.getContractFactory('MockERC721');
      const mockNFT = await MockERC721.deploy();
      await mockNFT.deployed();
      await mockNFT.mint(seller.address, 1);
      await mockNFT.connect(seller).setApprovalForAll(escrowListings.address, true);

      await escrowListings
        .connect(seller)
        .list(mockNFT.address, 1, buyer.address, price, minBid, escrowAmount, true, auctionDuration);

      const bidAmount = ethers.utils.parseEther('1');
      await escrowAuctions.connect(buyer).batchPlaceAuctionBid(mockNFT.address, [1], [bidAmount], { value: bidAmount });

      await ethers.provider.send('evm_increaseTime', [auctionDuration + 1]);
      await ethers.provider.send('evm_mine');

      await expect(escrowAuctions.endAuction(mockNFT.address, 1))
        .to.emit(escrowAuctions, 'AuctionFinalized')
        .to.not.emit(escrowAuctions, 'RoyaltyPaid');
    });
  });

  describe('Set EscrowListings', function () {
    it('Should allow owner to set EscrowListings address', async function () {
      const newEscrowListings = await EscrowListings.deploy(escrowStorage.address, escrowAuctions.address);
      await newEscrowListings.deployed();
      await escrowAuctions.connect(owner).setEscrowListings(newEscrowListings.address);
      expect(await escrowAuctions.escrowListings()).to.equal(newEscrowListings.address);
    });

    it('Should revert if non-owner tries to set EscrowListings', async function () {
      await expect(escrowAuctions.connect(other).setEscrowListings(ethers.constants.AddressZero)).to.be.revertedWith('Only owner');
    });

    it('Should revert if invalid address is provided', async function () {
      await expect(escrowAuctions.connect(owner).setEscrowListings(ethers.constants.AddressZero)).to.be.revertedWith('Invalid address');
    });
  });
});
