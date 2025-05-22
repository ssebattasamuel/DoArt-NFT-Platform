const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Escrow Contracts', function () {
  let DoArt,
    doArt,
    EscrowStorage,
    escrowStorage,
    EscrowListings,
    escrowListings,
    EscrowAuctions,
    escrowAuctions,
    EscrowLazyMinting,
    escrowLazyMinting;
  let owner, seller, buyer, bidder, artist;
  const metadataURI = 'ipfs://QmTest123';
  const royaltyBps = 500; // 5%
  const price = ethers.parseEther('1');
  const minBid = ethers.parseEther('0.1');
  const escrowAmount = ethers.parseEther('0.2');
  const auctionDuration = 60 * 60 * 24; // 1 day

  beforeEach(async function () {
    [owner, seller, buyer, bidder, artist] = await ethers.getSigners();
    console.log('Deployer address:', owner.address);

    // Deploy EscrowStorage
    EscrowStorage = await ethers.getContractFactory('EscrowStorage', owner);
    console.log('EscrowStorage factory retrieved');
    try {
      escrowStorage = await EscrowStorage.deploy();
      await escrowStorage.waitForDeployment();
      console.log('EscrowStorage deployed, address:', escrowStorage.address);
      if (!escrowStorage.address)
        throw new Error('EscrowStorage address is null');
    } catch (error) {
      console.error('EscrowStorage deployment failed:', error);
      throw error;
    }

    // Deploy DoArt
    DoArt = await ethers.getContractFactory('DoArt', owner);
    doArt = await DoArt.deploy(escrowStorage.address);
    await doArt.waitForDeployment();
    console.log('DoArt address:', doArt.address);
    if (!doArt.address) throw new Error('DoArt address is null');

    // Deploy EscrowAuctions
    EscrowAuctions = await ethers.getContractFactory('EscrowAuctions', owner);
    escrowAuctions = await EscrowAuctions.deploy(escrowStorage.address);
    await escrowAuctions.waitForDeployment();
    console.log('EscrowAuctions address:', escrowAuctions.address);
    if (!escrowAuctions.address)
      throw new Error('EscrowAuctions address is null');

    // Deploy EscrowListings
    EscrowListings = await ethers.getContractFactory('EscrowListings', owner);
    escrowListings = await EscrowListings.deploy(
      escrowStorage.address,
      escrowAuctions.address
    );
    await escrowListings.waitForDeployment();
    console.log('EscrowListings address:', escrowListings.address);
    if (!escrowListings.address)
      throw new Error('EscrowListings address is null');

    // Deploy EscrowLazyMinting
    EscrowLazyMinting = await ethers.getContractFactory(
      'EscrowLazyMinting',
      owner
    );
    escrowLazyMinting = await EscrowLazyMinting.deploy(escrowStorage.address);
    await escrowLazyMinting.waitForDeployment();
    console.log('EscrowLazyMinting address:', escrowLazyMinting.address);
    if (!escrowLazyMinting.address)
      throw new Error('EscrowLazyMinting address is null');

    // Grant ADMIN_ROLE in EscrowStorage
    await escrowStorage.grantRole(
      await escrowStorage.ADMIN_ROLE(),
      escrowListings.address
    );
    await escrowStorage.grantRole(
      await escrowStorage.ADMIN_ROLE(),
      escrowAuctions.address
    );
    await escrowStorage.grantRole(
      await escrowStorage.ADMIN_ROLE(),
      escrowLazyMinting.address
    );
    await escrowStorage.grantRole(
      await escrowStorage.ADMIN_ROLE(),
      doArt.address
    );

    // Grant roles
    await doArt.grantRole(await doArt.ARTIST_ROLE(), artist.address);
    await doArt.grantRole(await doArt.MINTER_ROLE(), escrowLazyMinting.address);
  });

  describe('Listing', function () {
    it('Should list a non-auction NFT', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).approve(escrowListings.address, 1);

      await expect(
        escrowListings
          .connect(artist)
          .list(
            doArt.address,
            1,
            buyer.address,
            price,
            minBid,
            escrowAmount,
            false,
            0
          )
      )
        .to.emit(escrowListings, 'Action')
        .withArgs(doArt.address, 1, 1, artist.address, price)
        .to.emit(escrowStorage, 'ListingChanged')
        .withArgs(doArt.address, 1);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.isListed).to.be.true;
      expect(listing.seller).to.equal(artist.address);
      expect(listing.buyer).to.equal(buyer.address);
      expect(listing.price).to.equal(price);
    });

    it('Should list an auction NFT', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).approve(escrowListings.address, 1);

      await expect(
        escrowListings
          .connect(artist)
          .list(
            doArt.address,
            1,
            ethers.constants.AddressZero,
            0,
            minBid,
            escrowAmount,
            true,
            auctionDuration
          )
      )
        .to.emit(escrowListings, 'Action')
        .withArgs(doArt.address, 1, 1, artist.address, 0)
        .to.emit(escrowStorage, 'ListingChanged')
        .to.emit(escrowStorage, 'AuctionChanged')
        .withArgs(doArt.address, 1);

      const auction = await escrowStorage.getAuction(doArt.address, 1);
      expect(auction.isActive).to.be.true;
      expect(auction.minBid).to.equal(minBid);
    });

    it('Should revert if not token owner', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await expect(
        escrowListings
          .connect(buyer)
          .list(
            doArt.address,
            1,
            buyer.address,
            price,
            minBid,
            escrowAmount,
            false,
            0
          )
      ).to.be.revertedWith('Not token owner');
    });
  });

  describe('Bidding', function () {
    beforeEach(async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).approve(escrowListings.address, 1);
      await escrowListings
        .connect(artist)
        .list(
          doArt.address,
          1,
          ethers.constants.AddressZero,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );
    });

    it('Should place a single bid', async function () {
      await expect(
        escrowAuctions
          .connect(bidder)
          .placeBid(doArt.address, [1], [minBid], { value: minBid })
      )
        .to.emit(escrowAuctions, 'Action')
        .withArgs(doArt.address, 1, 3, bidder.address, minBid)
        .to.emit(escrowStorage, 'BidChanged')
        .withArgs(doArt.address, 1);

      const bids = await escrowStorage.getBids(doArt.address, 1);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bidder.address);
      expect(bids[0].amount).to.equal(minBid);
    });
  });

  describe('Auction Bidding', function () {
    beforeEach(async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).approve(escrowListings.address, 1);
      await escrowListings
        .connect(artist)
        .list(
          doArt.address,
          1,
          ethers.constants.AddressZero,
          0,
          minBid,
          escrowAmount,
          true,
          auctionDuration
        );
    });

    it('Should place a single auction bid', async function () {
      await expect(
        escrowAuctions
          .connect(bidder)
          .placeBid(doArt.address, [1], [minBid], { value: minBid })
      )
        .to.emit(escrowAuctions, 'Action')
        .withArgs(doArt.address, 1, 3, bidder.address, minBid)
        .to.emit(escrowStorage, 'BidChanged')
        .withArgs(doArt.address, 1);

      const auction = await escrowStorage.getAuction(doArt.address, 1);
      expect(auction.highestBidder).to.equal(bidder.address);
      expect(auction.highestBid).to.equal(minBid);
    });
  });

  describe('Lazy Minting', function () {
    it('Should redeem a lazy mint voucher', async function () {
      const tokenId = 1;
      const voucher = {
        tokenId,
        creator: artist.address,
        price: price,
        uri: metadataURI,
        royaltyBps,
        signature: '0x',
      };

      const domain = {
        name: 'DoArtNFTPlatform',
        version: '1',
        chainId: await ethers.provider.getNetwork().then((net) => net.chainId),
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
      const signature = await artist.signTypedData(domain, types, voucher);
      voucher.signature = signature;

      await expect(
        escrowLazyMinting
          .connect(buyer)
          .redeemLazyMint(doArt.address, voucher, { value: price })
      )
        .to.emit(escrowLazyMinting, 'Action')
        .withArgs(doArt.address, tokenId, 10, buyer.address, price);

      expect(await doArt.ownerOf(tokenId)).to.equal(buyer.address);
      expect(await doArt.tokenURI(tokenId)).to.equal(metadataURI);
      expect(await escrowStorage.getVoucherRedeemed(doArt.address, tokenId)).to
        .be.true;
    });
  });

  describe('Escrow and Royalties', function () {
    beforeEach(async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).approve(escrowListings.address, 1);
      await escrowListings
        .connect(artist)
        .list(
          doArt.address,
          1,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );
    });

    it('Should handle escrow deposit and approval', async function () {
      await expect(
        escrowListings
          .connect(buyer)
          .depositEarnest(doArt.address, 1, { value: escrowAmount })
      )
        .to.emit(escrowListings, 'Action')
        .withArgs(doArt.address, 1, 5, buyer.address, escrowAmount)
        .to.emit(escrowStorage, 'ListingChanged')
        .withArgs(doArt.address, 1);

      await expect(
        escrowListings.connect(buyer).approveArtwork(doArt.address, 1, true)
      )
        .to.emit(escrowListings, 'Action')
        .withArgs(doArt.address, 1, 6, buyer.address, 1)
        .to.emit(escrowStorage, 'ListingChanged')
        .withArgs(doArt.address, 1);

      await escrowListings.connect(artist).approveSale(doArt.address, 1);
    });
  });

  describe('Auction Ending', function () {
    beforeEach(async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).approve(escrowListings.address, 1);
      await escrowListings
        .connect(artist)
        .list(
          doArt.address,
          1,
          ethers.constants.AddressZero,
          0,
          minBid,
          escrowAmount,
          true,
          auctionDuration
        );
      await escrowAuctions
        .connect(bidder)
        .placeBid(doArt.address, [1], [minBid], { value: minBid });
    });

    it('Should end auction with winner', async function () {
      await ethers.provider.send('evm_increaseTime', [auctionDuration + 1]);
      await ethers.provider.send('evm_mine');

      await expect(escrowAuctions.connect(bidder).endAuction(doArt.address, 1))
        .to.emit(escrowAuctions, 'Action')
        .withArgs(doArt.address, 1, 4, bidder.address, minBid)
        .to.emit(escrowStorage, 'AuctionChanged')
        .withArgs(doArt.address, 1);

      expect(await doArt.ownerOf(1)).to.equal(bidder.address);
    });
  });
});
