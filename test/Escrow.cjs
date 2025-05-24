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
  const price = ethers.utils.parseEther('1');
  const minBid = ethers.utils.parseEther('0.1');
  const escrowAmount = ethers.utils.parseEther('0.2');
  const auctionDuration = 60 * 60 * 24; // 1 day

  beforeEach(async function () {
    [owner, seller, buyer, bidder, artist] = await ethers.getSigners();
    console.log('Deployer address:', owner.address);

    // Deploy EscrowStorage
    EscrowStorage = await ethers.getContractFactory('EscrowStorage', owner);
    console.log('EscrowStorage factory retrieved');
    try {
      escrowStorage = await EscrowStorage.deploy();
      console.log('EscrowStorage deployment initiated');
      await escrowStorage.deployed();
      console.log('EscrowStorage deployed, address:', escrowStorage.address);
      const deployTx = escrowStorage.deployTransaction;
      console.log('EscrowStorage deployment tx:', deployTx.hash);
      const receipt = await deployTx.wait();
      console.log('EscrowStorage deployment receipt:', {
        contractAddress: receipt.contractAddress,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
      });
      if (!escrowStorage.address) {
        throw new Error('EscrowStorage address is null');
      }
    } catch (error) {
      console.error('EscrowStorage deployment failed:', error);
      throw error;
    }

    // Deploy DoArt
    DoArt = await ethers.getContractFactory('DoArt', owner);
    doArt = await DoArt.deploy(escrowStorage.address);
    await doArt.deployed();
    console.log('DoArt address:', doArt.address);
    if (!doArt.address) throw new Error('DoArt address is null');

    // Deploy EscrowAuctions with placeholder EscrowListings address
    EscrowAuctions = await ethers.getContractFactory('EscrowAuctions', owner);
    escrowAuctions = await EscrowAuctions.deploy(
      escrowStorage.address,
      ethers.constants.AddressZero
    );
    await escrowAuctions.deployed();
    console.log('EscrowAuctions address:', escrowAuctions.address);
    if (!escrowAuctions.address)
      throw new Error('EscrowAuctions address is null');

    // Deploy EscrowListings with EscrowAuctions address
    EscrowListings = await ethers.getContractFactory('EscrowListings', owner);
    escrowListings = await EscrowListings.deploy(
      escrowStorage.address,
      escrowAuctions.address
    );
    await escrowListings.deployed();
    console.log('EscrowListings address:', escrowListings.address);
    if (!escrowListings.address)
      throw new Error('EscrowListings address is null');

    // Update EscrowAuctions with EscrowListings address
    await escrowAuctions.setEscrowListings(escrowListings.address);
    console.log(
      'EscrowAuctions updated with EscrowListings address:',
      escrowListings.address
    );

    // Deploy EscrowLazyMinting
    EscrowLazyMinting = await ethers.getContractFactory(
      'EscrowLazyMinting',
      owner
    );
    escrowLazyMinting = await EscrowLazyMinting.deploy(escrowStorage.address);
    await escrowLazyMinting.deployed();
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
      console.log('Placing bid with bidder:', bidder.address);
      const tx = await escrowAuctions
        .connect(bidder)
        .placeBid(doArt.address, [1], [minBid], { value: minBid });
      const receipt = await tx.wait();
      console.log('Bid transaction receipt:', {
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.logs.map((e) => ({ name: e.eventName, args: e.args })),
      });

      await expect(tx)
        .to.emit(escrowAuctions, 'Action')
        .withArgs(doArt.address, 1, 3, bidder.address, minBid)
        .to.emit(escrowStorage, 'BidChanged')
        .withArgs(doArt.address, 1);

      const auction = await escrowStorage.getAuction(doArt.address, 1);
      console.log('Auction state:', {
        isActive: auction.isActive,
        highestBidder: auction.highestBidder,
        highestBid: auction.highestBid.toString(),
      });
      expect(auction.highestBidder).to.equal(bidder.address);
      expect(auction.highestBid).to.equal(minBid);
    });
  });

  describe('Lazy Minting', function () {
    it('Should redeem a lazy mint voucher', async function () {
      const tokenId = 1;
      const metadataURI = 'ipfs://QmTest123';
      const royaltyBps = 500; // 5%
      const price = ethers.utils.parseEther('0.1');
      const chainId = (await ethers.provider.getNetwork()).chainId;
      console.log('Chain ID:', chainId);

      const domain = {
        name: 'DoArtNFTPlatform',
        version: '1',
        chainId: chainId,
        verifyingContract: escrowLazyMinting.address,
      };
      console.log('Domain:', domain);

      const types = {
        LazyMintVoucher: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'uri', type: 'string' },
          { name: 'royaltyBps', type: 'uint96' },
        ],
      };
      console.log('Types:', types);

      const voucher = {
        tokenId,
        creator: artist.address,
        price,
        uri: metadataURI,
        royaltyBps,
      };
      console.log('Voucher:', voucher);

      const signature = await artist._signTypedData(domain, types, voucher);
      console.log('Signature:', signature);

      const fullVoucher = {
        tokenId,
        creator: artist.address,
        price,
        uri: metadataURI,
        royaltyBps,
        signature, // Include signature
      };
      console.log('Full Voucher:', fullVoucher);

      const isValid = await escrowLazyMinting.verify(fullVoucher, signature);
      console.log('Is Valid:', isValid);
      expect(isValid).to.be.true;

      const balanceBefore = await doArt.balanceOf(buyer.address);
      const tx = await escrowLazyMinting
        .connect(buyer)
        .redeemLazyMint(doArt.address, fullVoucher, { value: price });
      const receipt = await tx.wait();
      console.log('Redeem Lazy Mint receipt:', {
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.logs.map((log) => {
          try {
            return { name: log.eventName, args: log.args };
          } catch {
            return { name: 'unknown', args: {} };
          }
        }),
      });

      expect(await doArt.balanceOf(buyer.address)).to.equal(
        balanceBefore.add(1)
      );
      expect(await doArt.ownerOf(tokenId)).to.equal(buyer.address);
      expect(await doArt.tokenURI(tokenId)).to.equal(metadataURI);
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
      // Fast-forward time to end the auction
      await ethers.provider.send('evm_increaseTime', [auctionDuration + 1]);
      await ethers.provider.send('evm_mine');

      // End the auction
      const tx = await escrowAuctions
        .connect(bidder)
        .endAuction(doArt.address, 1);
      const receipt = await tx.wait();
      console.log('End Auction receipt:', {
        gasUsed: receipt.gasUsed.toString(),
        events: receipt.logs.map((log) => {
          try {
            const parsedLog = escrowAuctions.interface.parseLog(log);
            return { name: parsedLog.name, args: parsedLog.args };
          } catch {
            return { name: 'unknown', args: log.args || {} };
          }
        }),
      });

      // Assertions
      const listing = await escrowStorage.getListing(doArt.address, 1);
      const auction = await escrowStorage.getAuction(doArt.address, 1);
      expect(listing.isListed).to.equal(false, 'Listing should be deleted');
      expect(auction.isActive).to.equal(false, 'Auction should be ended');
      expect(await doArt.ownerOf(1)).to.equal(
        bidder.address,
        'NFT should be transferred to bidder'
      );
    });
  });
});
