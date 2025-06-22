const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('EscrowStorage Contract', function () {
  let DoArt, EscrowStorage;
  let doArt, escrowStorage;
  let owner, admin, pauser, other;
  const metadataURI = 'ipfs://QmTest123';
  const royaltyBps = 500; // 5%

  beforeEach(async function () {
    [owner, admin, pauser, other] = await ethers.getSigners();

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

    // Grant roles
    await escrowStorage.grantRole(
      await escrowStorage.ADMIN_ROLE(),
      admin.address
    );
    await escrowStorage.grantRole(
      await escrowStorage.PAUSER_ROLE(),
      pauser.address
    );
    await doArt.grantRole(await doArt.ARTIST_ROLE(), owner.address);
  });

  describe('Role Initialization', function () {
    it('Should set correct roles in constructor', async function () {
      expect(
        await escrowStorage.hasRole(
          await escrowStorage.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.be.true;
      expect(
        await escrowStorage.hasRole(
          await escrowStorage.ADMIN_ROLE(),
          owner.address
        )
      ).to.be.true;
      expect(
        await escrowStorage.hasRole(
          await escrowStorage.PAUSER_ROLE(),
          owner.address
        )
      ).to.be.true;
    });

    it('Should allow admin to grant and revoke roles', async function () {
      const adminRole = await escrowStorage.ADMIN_ROLE();
      await escrowStorage.connect(owner).grantRole(adminRole, other.address);
      expect(await escrowStorage.hasRole(adminRole, other.address)).to.be.true;
      await escrowStorage.connect(owner).revokeRole(adminRole, other.address);
      expect(await escrowStorage.hasRole(adminRole, other.address)).to.be.false;
    });
  });

  describe('Pausing', function () {
    it('Should allow pauser to pause and unpause', async function () {
      await escrowStorage.connect(pauser).pause();
      expect(await escrowStorage.paused()).to.be.true;
      await escrowStorage.connect(pauser).unpause();
      expect(await escrowStorage.paused()).to.be.false;
    });

    it('Should revert if non-pauser tries to pause or unpause', async function () {
      await expect(escrowStorage.connect(other).pause()).to.be.revertedWith(
        /AccessControl: account .* is missing role/
      );
      await escrowStorage.connect(pauser).pause();
      await expect(escrowStorage.connect(other).unpause()).to.be.revertedWith(
        /AccessControl: account .* is missing role/
      );
    });
  });

  describe('NFT Management', function () {
    it('Should return correct total NFTs', async function () {
      expect(await escrowStorage.getTotalNfts()).to.equal(0);
      await doArt.connect(owner).mint(metadataURI, royaltyBps);
      expect(await escrowStorage.getTotalNfts()).to.equal(1);
      await doArt.connect(owner).mint(metadataURI, royaltyBps);
      expect(await escrowStorage.getTotalNfts()).to.equal(2);
    });
  });

  describe('Listings', function () {
    let listing;
    beforeEach(async function () {
      await doArt.connect(owner).mint(metadataURI, royaltyBps);
      listing = {
        nftContract: doArt.address,
        seller: owner.address,
        buyer: ethers.constants.AddressZero,
        price: ethers.utils.parseEther('1'),
        minBid: ethers.utils.parseEther('0.5'),
        escrowAmount: ethers.utils.parseEther('0.1'),
        buyerDeposit: 0,
        viewingPeriodEnd:
          (await ethers.provider.getBlock('latest')).timestamp +
          3 * 24 * 60 * 60,
        isListed: true,
        isApproved: false,
        saleApprover: ethers.constants.AddressZero,
        isAuction: false,
        tokenId: 1
      };
    });

    it('Should allow admin to set and get listing', async function () {
      await expect(
        escrowStorage.connect(admin).setListing(doArt.address, 1, listing)
      )
        .to.emit(escrowStorage, 'ListingChanged')
        .withArgs(doArt.address, 1);

      const fetchedListing = await escrowStorage.getListing(doArt.address, 1);
      expect(fetchedListing.nftContract).to.equal(listing.nftContract);
      expect(fetchedListing.seller).to.equal(listing.seller);
      expect(fetchedListing.price).to.equal(listing.price);
      expect(fetchedListing.isListed).to.be.true;
      expect(fetchedListing.tokenId).to.equal(1);
    });

    it('Should revert if non-admin tries to set listing', async function () {
      await expect(
        escrowStorage.connect(other).setListing(doArt.address, 1, listing)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it('Should allow admin to delete listing', async function () {
      await escrowStorage.connect(admin).setListing(doArt.address, 1, listing);
      await expect(escrowStorage.connect(admin).deleteListing(doArt.address, 1))
        .to.emit(escrowStorage, 'ListingChanged')
        .withArgs(doArt.address, 1);

      const fetchedListing = await escrowStorage.getListing(doArt.address, 1);
      expect(fetchedListing.isListed).to.be.false;
      expect(fetchedListing.tokenId).to.equal(1);
    });

    it('Should revert if non-admin tries to delete listing', async function () {
      await escrowStorage.connect(admin).setListing(doArt.address, 1, listing);
      await expect(
        escrowStorage.connect(other).deleteListing(doArt.address, 1)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it('Should return all active listings', async function () {
      await doArt.connect(owner).mint(metadataURI, royaltyBps); // Token ID 2
      const listing2 = { ...listing, tokenId: 2 };
      await escrowStorage.connect(admin).setListing(doArt.address, 1, listing);
      await escrowStorage.connect(admin).setListing(doArt.address, 2, listing2);

      const listings = await escrowStorage.getListings();
      expect(listings.length).to.equal(2);
      expect(listings[0].tokenId).to.equal(1);
      expect(listings[1].tokenId).to.equal(2);
    });

    it('Should return empty array if no listings', async function () {
      const listings = await escrowStorage.getListings();
      expect(listings.length).to.equal(0);
    });
  });

  describe('Bids', function () {
    let bid;
    beforeEach(async function () {
      bid = {
        bidder: other.address,
        amount: ethers.utils.parseEther('1')
      };
      await doArt.connect(owner).mint(metadataURI, royaltyBps);
    });

    it('Should allow admin to push and get bids', async function () {
      await expect(escrowStorage.connect(admin).pushBid(doArt.address, 1, bid))
        .to.emit(escrowStorage, 'BidChanged')
        .withArgs(doArt.address, 1);

      const bids = await escrowStorage.getBids(doArt.address, 1);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(bid.bidder);
      expect(bids[0].amount).to.equal(bid.amount);
    });

    it('Should revert if non-admin tries to push bid', async function () {
      await expect(
        escrowStorage.connect(other).pushBid(doArt.address, 1, bid)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it('Should allow admin to delete bids', async function () {
      await escrowStorage.connect(admin).pushBid(doArt.address, 1, bid);
      await expect(escrowStorage.connect(admin).deleteBids(doArt.address, 1))
        .to.emit(escrowStorage, 'BidChanged')
        .withArgs(doArt.address, 1);

      const bids = await escrowStorage.getBids(doArt.address, 1);
      expect(bids.length).to.equal(0);
    });

    it('Should revert if non-admin tries to delete bids', async function () {
      await escrowStorage.connect(admin).pushBid(doArt.address, 1, bid);
      await expect(
        escrowStorage.connect(other).deleteBids(doArt.address, 1)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });

  describe('Auctions', function () {
    let auction;
    beforeEach(async function () {
      await doArt.connect(owner).mint(metadataURI, royaltyBps);
      auction = {
        endTime: (await ethers.provider.getBlock('latest')).timestamp + 86400,
        minBid: ethers.utils.parseEther('0.5'),
        minIncrement: ethers.utils.parseEther('0.05'),
        highestBidder: ethers.constants.AddressZero,
        highestBid: 0,
        isActive: true
      };
    });

    it('Should allow admin to set and get auction', async function () {
      await expect(
        escrowStorage.connect(admin).setAuction(doArt.address, 1, auction)
      )
        .to.emit(escrowStorage, 'AuctionChanged')
        .withArgs(doArt.address, 1);

      const fetchedAuction = await escrowStorage.getAuction(doArt.address, 1);
      expect(fetchedAuction.minBid).to.equal(auction.minBid);
      expect(fetchedAuction.isActive).to.be.true;
    });

    it('Should revert if non-admin tries to set auction', async function () {
      await expect(
        escrowStorage.connect(other).setAuction(doArt.address, 1, auction)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it('Should allow admin to delete auction', async function () {
      await escrowStorage.connect(admin).setAuction(doArt.address, 1, auction);
      await expect(escrowStorage.connect(admin).deleteAuction(doArt.address, 1))
        .to.emit(escrowStorage, 'AuctionChanged')
        .withArgs(doArt.address, 1);

      const fetchedAuction = await escrowStorage.getAuction(doArt.address, 1);
      expect(fetchedAuction.isActive).to.be.false;
    });

    it('Should revert if non-admin tries to delete auction', async function () {
      await escrowStorage.connect(admin).setAuction(doArt.address, 1, auction);
      await expect(
        escrowStorage.connect(other).deleteAuction(doArt.address, 1)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it('Should return all active auctions', async function () {
      await doArt.connect(owner).mint(metadataURI, royaltyBps); // Token ID 2
      const auction2 = { ...auction };
      await escrowStorage.connect(admin).setAuction(doArt.address, 1, auction);
      await escrowStorage.connect(admin).setAuction(doArt.address, 2, auction2);

      const auctions = await escrowStorage.getAuctions();
      expect(auctions.length).to.equal(2);
    });

    it('Should return empty array if no auctions', async function () {
      const auctions = await escrowStorage.getAuctions();
      expect(auctions.length).to.equal(0);
    });
  });

  describe('Lazy Mint Vouchers', function () {
    it('Should allow admin to set and get voucher redeemed status', async function () {
      await expect(
        escrowStorage.connect(admin).setVoucherRedeemed(doArt.address, 1, true)
      ).to.not.be.reverted;

      expect(await escrowStorage.getVoucherRedeemed(doArt.address, 1)).to.be
        .true;
    });

    it('Should revert if non-admin tries to set voucher redeemed', async function () {
      await expect(
        escrowStorage.connect(other).setVoucherRedeemed(doArt.address, 1, true)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it('Should return false for unredeemed voucher', async function () {
      expect(await escrowStorage.getVoucherRedeemed(doArt.address, 1)).to.be
        .false;
    });
  });
});
