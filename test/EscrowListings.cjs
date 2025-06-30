const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('EscrowListings Contract', function () {
  let DoArt, EscrowStorage, EscrowAuctions, EscrowListings, MockERC721;
  let doArt, escrowStorage, escrowAuctions, escrowListings, mockERC721;
  let owner, seller, buyer, pauser, other;
  const metadataURI = 'ipfs://QmTest123';
  const royaltyBps = 500; // 5%
  const price = ethers.utils.parseEther('1');
  const minBid = ethers.utils.parseEther('0.5');
  const escrowAmount = ethers.utils.parseEther('0.1');
  const auctionDuration = 86400; // 1 day
  const ADMIN_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('ADMIN_ROLE')
  );

  beforeEach(async function () {
    [owner, seller, buyer, pauser, other] = await ethers.getSigners();

    // Deploy DoArt
    DoArt = await ethers.getContractFactory('DoArt', owner);
    doArt = await DoArt.deploy(ethers.constants.AddressZero);
    await doArt.deployed();

    // Deploy EscrowStorage
    EscrowStorage = await ethers.getContractFactory('EscrowStorage', owner);
    escrowStorage = await EscrowStorage.deploy(doArt.address);
    await escrowStorage.deployed();

    // Update DoArt with EscrowStorage
    await doArt.connect(owner).setStorageContract(escrowStorage.address);

    // Deploy EscrowAuctions
    EscrowAuctions = await ethers.getContractFactory('EscrowAuctions', owner);
    escrowAuctions = await EscrowAuctions.deploy(
      escrowStorage.address,
      ethers.constants.AddressZero
    );
    await escrowAuctions.deployed();

    // Deploy EscrowListings
    EscrowListings = await ethers.getContractFactory('EscrowListings', owner);
    escrowListings = await EscrowListings.deploy(
      escrowStorage.address,
      escrowAuctions.address
    );
    await escrowListings.deployed();

    // Deploy MockERC721 for non-royalty tests
    MockERC721 = await ethers.getContractFactory('MockERC721', owner);
    mockERC721 = await MockERC721.deploy();
    await mockERC721.deployed();

    // Update EscrowAuctions with EscrowListings
    await escrowAuctions
      .connect(owner)
      .setEscrowListings(escrowListings.address);

    // Grant EscrowListings and EscrowAuctions ADMIN_ROLE in EscrowStorage
    await escrowStorage.grantRole(ADMIN_ROLE, escrowListings.address);
    await escrowStorage.grantRole(ADMIN_ROLE, escrowAuctions.address);

    // Grant roles
    await doArt.grantRole(await doArt.ARTIST_ROLE(), seller.address);
    await escrowListings.grantRole(
      await escrowListings.PAUSER_ROLE(),
      pauser.address
    );

    // Mint an NFT
    await doArt.connect(seller).mint(metadataURI, royaltyBps);
    await doArt.connect(seller).setApprovalForAll(escrowListings.address, true);

    // Verify escrowAuctions address is set correctly
    expect(await escrowListings.escrowAuctions()).to.equal(
      escrowAuctions.address
    );
  });

  describe('Role Initialization', function () {
    it('Should set correct roles in constructor', async function () {
      expect(
        await escrowListings.hasRole(
          await escrowListings.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.be.true;
      expect(
        await escrowListings.hasRole(
          await escrowListings.PAUSER_ROLE(),
          owner.address
        )
      ).to.be.true;
      expect(await escrowStorage.hasRole(ADMIN_ROLE, escrowListings.address)).to
        .be.true;
      expect(await escrowStorage.hasRole(ADMIN_ROLE, escrowAuctions.address)).to
        .be.true;
    });
  });

  describe('Pausing', function () {
    it('Should allow pauser to pause and unpause', async function () {
      await escrowListings.connect(pauser).pause();
      expect(await escrowListings.paused()).to.be.true;
      await escrowListings.connect(pauser).unpause();
      expect(await escrowListings.paused()).to.be.false;
    });

    it('Should revert if non-pauser tries to pause or unpause', async function () {
      await expect(escrowListings.connect(other).pause()).to.be.revertedWith(
        /AccessControl: account .* is missing role/
      );
      await escrowListings.connect(pauser).pause();
      await expect(escrowListings.connect(other).unpause()).to.be.revertedWith(
        /AccessControl: account .* is missing role/
      );
    });
  });

  describe('Listing', function () {
    it('Should allow seller to list an NFT', async function () {
      await expect(
        escrowListings
          .connect(seller)
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
        .to.emit(escrowListings, 'NFTListed')
        .withArgs(
          doArt.address,
          1,
          seller.address,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.isListed).to.be.true;
      expect(listing.seller).to.equal(seller.address);
      expect(listing.buyer).to.equal(buyer.address);
      expect(listing.price).to.equal(price);
      expect(listing.minBid).to.equal(minBid);
      expect(listing.escrowAmount).to.equal(escrowAmount);
      expect(await doArt.ownerOf(1)).to.equal(escrowListings.address);
    });

    it('Should revert if contract not approved', async function () {
      await doArt
        .connect(seller)
        .setApprovalForAll(escrowListings.address, false);
      await expect(
        escrowListings
          .connect(seller)
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
      ).to.be.revertedWith('Contract not approved');
    });

    it('Should revert if token already listed', async function () {
      // List the token
      await escrowListings
        .connect(seller)
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
      // Verify token is owned by EscrowListings
      expect(await doArt.ownerOf(1)).to.equal(escrowListings.address);
      // Attempt to list again
      await expect(
        escrowListings
          .connect(seller)
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

    it('Should revert if price and minBid are zero', async function () {
      await expect(
        escrowListings
          .connect(seller)
          .list(doArt.address, 1, buyer.address, 0, 0, escrowAmount, false, 0)
      ).to.be.revertedWith('Price or minBid must be > 0');
    });

    it('Should create auction if isAuction is true', async function () {
      await expect(
        escrowListings
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
          )
      )
        .to.emit(escrowListings, 'NFTListed')
        .withArgs(
          doArt.address,
          1,
          seller.address,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          true,
          auctionDuration
        );

      const auction = await escrowStorage.getAuction(doArt.address, 1);
      expect(auction.isActive).to.be.true;
      expect(auction.minBid).to.equal(minBid);
      expect(auction.minIncrement).to.equal(minBid.div(10));
    });
  });

  describe('Batch Listing', function () {
    beforeEach(async function () {
      await doArt.connect(seller).mint(metadataURI, royaltyBps); // Token ID 2
    });

    it('Should allow batch listing of NFTs', async function () {
      const params = [
        {
          nftContract: doArt.address,
          tokenId: 1,
          buyer: buyer.address,
          price: price,
          minBid: minBid,
          escrowAmount: escrowAmount,
          isAuction: false,
          auctionDuration: 0
        },
        {
          nftContract: doArt.address,
          tokenId: 2,
          buyer: buyer.address,
          price: price,
          minBid: minBid,
          escrowAmount: escrowAmount,
          isAuction: false,
          auctionDuration: 0
        }
      ];

      await expect(escrowListings.connect(seller).batchList(params))
        .to.emit(escrowListings, 'NFTListed')
        .withArgs(
          doArt.address,
          1,
          seller.address,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        )
        .to.emit(escrowListings, 'NFTListed')
        .withArgs(
          doArt.address,
          2,
          seller.address,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );

      const listing1 = await escrowStorage.getListing(doArt.address, 1);
      const listing2 = await escrowStorage.getListing(doArt.address, 2);
      expect(listing1.isListed).to.be.true;
      expect(listing2.isListed).to.be.true;
    });

    it('Should revert if batch size exceeds limit', async function () {
      const params = new Array(51).fill({
        nftContract: doArt.address,
        tokenId: 1,
        buyer: buyer.address,
        price: price,
        minBid: minBid,
        escrowAmount: escrowAmount,
        isAuction: false,
        auctionDuration: 0
      });
      await expect(
        escrowListings.connect(seller).batchList(params)
      ).to.be.revertedWith('Batch size exceeds limit');
    });

    it('Should handle gas usage for large batch listing', async function () {
      // Mint 50 tokens
      for (let i = 2; i <= 50; i++) {
        await doArt.connect(seller).mint(metadataURI, royaltyBps);
      }
      await doArt
        .connect(seller)
        .setApprovalForAll(escrowListings.address, true);

      const params = Array.from({ length: 50 }, (_, i) => ({
        nftContract: doArt.address,
        tokenId: i + 1,
        buyer: buyer.address,
        price: price,
        minBid: minBid,
        escrowAmount: escrowAmount,
        isAuction: false,
        auctionDuration: 0
      }));

      const tx = await escrowListings.connect(seller).batchList(params);
      const receipt = await tx.wait();
      console.log(
        `Gas used for batch listing 50 NFTs: ${receipt.gasUsed.toString()}`
      );

      for (let i = 1; i <= 50; i++) {
        const listing = await escrowStorage.getListing(doArt.address, i);
        expect(listing.isListed).to.be.true;
      }
    });
  });

  describe('Update Listing', function () {
    beforeEach(async function () {
      await doArt.connect(seller).mint(metadataURI, royaltyBps); // Token ID 2
      await doArt
        .connect(seller)
        .setApprovalForAll(escrowListings.address, true);
    });

    it('Should allow seller to update listing price', async function () {
      await escrowListings
        .connect(seller)
        .list(
          doArt.address,
          2,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );
      const newPrice = ethers.utils.parseEther('2');
      await expect(
        escrowListings.connect(seller).updateListing(doArt.address, 2, newPrice)
      )
        .to.emit(escrowListings, 'ListingUpdated')
        .withArgs(doArt.address, 2, seller.address, newPrice);

      const listing = await escrowStorage.getListing(doArt.address, 2);
      expect(listing.price).to.equal(newPrice);
    });

    it('Should revert if non-seller tries to update', async function () {
      await escrowListings
        .connect(seller)
        .list(
          doArt.address,
          2,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );
      await expect(
        escrowListings.connect(other).updateListing(doArt.address, 2, price)
      ).to.be.revertedWith('Only seller');
    });

    it('Should revert if listing is an auction', async function () {
      await escrowListings
        .connect(seller)
        .list(
          doArt.address,
          2,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          true,
          auctionDuration
        );
      await expect(
        escrowListings.connect(seller).updateListing(doArt.address, 2, price)
      ).to.be.revertedWith('Cannot update auction listings');
    });
  });

  describe('Deposit Earnest', function () {
    beforeEach(async function () {
      await escrowListings
        .connect(seller)
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

    it('Should allow buyer to deposit earnest', async function () {
      const deposit = ethers.utils.parseEther('0.05');
      await expect(
        escrowListings
          .connect(buyer)
          .depositEarnest(doArt.address, 1, { value: deposit })
      )
        .to.emit(escrowListings, 'EarnestDeposited')
        .withArgs(doArt.address, 1, buyer.address, deposit);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.buyer).to.equal(buyer.address);
      expect(listing.buyerDeposit).to.equal(deposit);
    });

    it('Should allow buyer to deposit earnest in multiple transactions', async function () {
      const deposit1 = ethers.utils.parseEther('0.05');
      const deposit2 = ethers.utils.parseEther('0.05');
      await expect(
        escrowListings
          .connect(buyer)
          .depositEarnest(doArt.address, 1, { value: deposit1 })
      )
        .to.emit(escrowListings, 'EarnestDeposited')
        .withArgs(doArt.address, 1, buyer.address, deposit1);
      await expect(
        escrowListings
          .connect(buyer)
          .depositEarnest(doArt.address, 1, { value: deposit2 })
      )
        .to.emit(escrowListings, 'EarnestDeposited')
        .withArgs(doArt.address, 1, buyer.address, deposit2);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.buyer).to.equal(buyer.address);
      expect(listing.buyerDeposit).to.equal(escrowAmount);
    });

    it('Should revert if deposit exceeds escrow amount', async function () {
      const deposit = ethers.utils.parseEther('0.2');
      await expect(
        escrowListings
          .connect(buyer)
          .depositEarnest(doArt.address, 1, { value: deposit })
      ).to.be.revertedWith('Deposit exceeds escrow amount');
    });

    it('Should revert if contract is paused', async function () {
      await escrowListings.connect(pauser).pause();
      await expect(
        escrowListings
          .connect(buyer)
          .depositEarnest(doArt.address, 1, { value: escrowAmount })
      ).to.be.revertedWith('Pausable: paused');
    });
  });

  describe('Approve Artwork', function () {
    beforeEach(async function () {
      await escrowListings
        .connect(seller)
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
      await escrowListings
        .connect(buyer)
        .depositEarnest(doArt.address, 1, { value: escrowAmount });
    });

    it('Should allow buyer to approve artwork', async function () {
      await expect(
        escrowListings.connect(buyer).approveArtwork(doArt.address, 1, true)
      )
        .to.emit(escrowListings, 'ArtworkApprovalUpdated')
        .withArgs(doArt.address, 1, buyer.address, true);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.isApproved).to.be.true;
    });

    it('Should revert if non-buyer tries to approve', async function () {
      await expect(
        escrowListings.connect(other).approveArtwork(doArt.address, 1, true)
      ).to.be.revertedWith('Only designated buyer');
    });

    it('Should revert if viewing period ended', async function () {
      const listing = await escrowStorage.getListing(doArt.address, 1);
      await ethers.provider.send('evm_increaseTime', [
        Number(listing.viewingPeriodEnd) -
          (await ethers.provider.getBlock('latest')).timestamp +
          1
      ]);
      await expect(
        escrowListings.connect(buyer).approveArtwork(doArt.address, 1, true)
      ).to.be.revertedWith('Viewing period ended');
    });
  });

  describe('Approve Sale', function () {
    beforeEach(async function () {
      await escrowListings
        .connect(seller)
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
      await escrowListings
        .connect(buyer)
        .depositEarnest(doArt.address, 1, { value: escrowAmount });
      await escrowListings
        .connect(buyer)
        .approveArtwork(doArt.address, 1, true);
    });

    it('Should allow seller to approve sale', async function () {
      await expect(escrowListings.connect(seller).approveSale(doArt.address, 1))
        .to.emit(escrowListings, 'SaleApproved')
        .withArgs(doArt.address, 1, seller.address, buyer.address);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.saleApprover).to.equal(seller.address);
    });

    it('Should allow buyer to approve sale', async function () {
      await expect(escrowListings.connect(buyer).approveSale(doArt.address, 1))
        .to.emit(escrowListings, 'SaleApproved')
        .withArgs(doArt.address, 1, buyer.address, buyer.address);
    });

    it('Should revert if non-seller or non-buyer tries to approve', async function () {
      await expect(
        escrowListings.connect(other).approveSale(doArt.address, 1)
      ).to.be.revertedWith('Only seller or buyer can approve');
    });
  });

  describe('Finalize Sale', function () {
    beforeEach(async function () {
      await escrowListings
        .connect(seller)
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
      await escrowListings
        .connect(buyer)
        .depositEarnest(doArt.address, 1, { value: escrowAmount });
      await escrowListings
        .connect(buyer)
        .approveArtwork(doArt.address, 1, true);
      await escrowListings.connect(seller).approveSale(doArt.address, 1);
    });

    it('Should finalize sale with royalty payment', async function () {
      const initialSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      const initialBuyerBalance = await ethers.provider.getBalance(
        buyer.address
      );

      await expect(
        escrowListings
          .connect(buyer)
          .finalizeSale(doArt.address, 1, { value: price })
      )
        .to.emit(escrowListings, 'RoyaltyPaid')
        .withArgs(
          doArt.address,
          1,
          seller.address,
          price.mul(royaltyBps).div(10000)
        )
        .to.emit(escrowListings, 'SaleFinalized')
        .withArgs(doArt.address, 1, seller.address, buyer.address, price);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.isListed).to.be.false;
      expect(await doArt.ownerOf(1)).to.equal(buyer.address);
    });

    it('Should finalize sale with no royalty for non-IERC2981 NFT', async function () {
      await mockERC721.connect(seller).mint(seller.address, 1);
      await mockERC721
        .connect(seller)
        .setApprovalForAll(escrowListings.address, true);
      await escrowListings
        .connect(seller)
        .list(
          mockERC721.address,
          1,
          buyer.address,
          price,
          minBid,
          escrowAmount,
          false,
          0
        );
      await escrowListings
        .connect(buyer)
        .depositEarnest(mockERC721.address, 1, { value: escrowAmount });
      await escrowListings
        .connect(buyer)
        .approveArtwork(mockERC721.address, 1, true);
      await escrowListings.connect(seller).approveSale(mockERC721.address, 1);

      const initialSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      await expect(
        escrowListings
          .connect(buyer)
          .finalizeSale(mockERC721.address, 1, { value: price })
      )
        .to.emit(escrowListings, 'SaleFinalized')
        .withArgs(mockERC721.address, 1, seller.address, buyer.address, price)
        .to.not.emit(escrowListings, 'RoyaltyPaid');

      const finalSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      expect(finalSellerBalance.sub(initialSellerBalance)).to.be.closeTo(
        price,
        ethers.utils.parseEther('0.01')
      );
      expect(await mockERC721.ownerOf(1)).to.equal(buyer.address);
    });

    it('Should revert if insufficient payment', async function () {
      await expect(
        escrowListings
          .connect(buyer)
          .finalizeSale(doArt.address, 1, { value: price.sub(1) })
      ).to.be.revertedWith('Insufficient payment');
    });

    it('Should revert if sale not approved', async function () {
      await escrowStorage.connect(owner).setListing(doArt.address, 1, {
        nftContract: doArt.address,
        seller: seller.address,
        buyer: buyer.address,
        price: price,
        minBid: minBid,
        escrowAmount: escrowAmount,
        buyerDeposit: escrowAmount,
        viewingPeriodEnd:
          (await ethers.provider.getBlock('latest')).timestamp +
          3 * 24 * 60 * 60,
        isListed: true,
        isApproved: true,
        saleApprover: ethers.constants.AddressZero,
        isAuction: false,
        tokenId: 1
      });
      await expect(
        escrowListings
          .connect(buyer)
          .finalizeSale(doArt.address, 1, { value: price })
      ).to.be.revertedWith('Sale not approved');
    });
  });

  describe('Cancel Sale', function () {
    beforeEach(async function () {
      await escrowListings
        .connect(seller)
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
      await escrowListings
        .connect(buyer)
        .depositEarnest(doArt.address, 1, { value: escrowAmount });
    });

    it('Should allow seller to cancel sale', async function () {
      await expect(escrowListings.connect(seller).cancelSale(doArt.address, 1))
        .to.emit(escrowListings, 'SaleCanceled')
        .withArgs(doArt.address, 1, seller.address);

      const listing = await escrowStorage.getListing(doArt.address, 1);
      expect(listing.isListed).to.be.false;
      expect(await doArt.ownerOf(1)).to.equal(seller.address);
    });

    it('Should allow buyer to cancel sale', async function () {
      await expect(escrowListings.connect(buyer).cancelSale(doArt.address, 1))
        .to.emit(escrowListings, 'SaleCanceled')
        .withArgs(doArt.address, 1, buyer.address);
    });

    it('Should revert if sale is approved', async function () {
      await escrowListings
        .connect(buyer)
        .approveArtwork(doArt.address, 1, true);
      await escrowListings.connect(seller).approveSale(doArt.address, 1);
      await expect(
        escrowListings.connect(seller).cancelSale(doArt.address, 1)
      ).to.be.revertedWith('Cannot cancel approved artwork');
    });
  });

  describe('Extend Viewing Period', function () {
    beforeEach(async function () {
      await escrowListings
        .connect(seller)
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

    it('Should allow seller to extend viewing period', async function () {
      const additionalTime = 86400;
      const listing = await escrowStorage.getListing(doArt.address, 1);
      await expect(
        escrowListings
          .connect(seller)
          .extendViewingPeriod(doArt.address, 1, additionalTime)
      )
        .to.emit(escrowListings, 'ViewingPeriodExtended')
        .withArgs(
          doArt.address,
          1,
          seller.address,
          listing.viewingPeriodEnd.add(additionalTime)
        );

      const updatedListing = await escrowStorage.getListing(doArt.address, 1);
      expect(updatedListing.viewingPeriodEnd).to.equal(
        listing.viewingPeriodEnd.add(additionalTime)
      );
    });

    it('Should revert if non-seller tries to extend', async function () {
      await expect(
        escrowListings
          .connect(other)
          .extendViewingPeriod(doArt.address, 1, 86400)
      ).to.be.revertedWith('Only seller');
    });
  });

  describe('Transfer for Auction', function () {
    beforeEach(async function () {
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
    });

  //   it('Should allow EscrowAuctions to transfer NFT', async function () {
  //     // Verify NFT ownership before transfer
  // expect(await doArt.ownerOf(1)).to.equal(escrowListings.address);
  //     // Fund escrowAuctions to cover gas
  //     await owner.sendTransaction({
  //       to: escrowAuctions.address,
  //       value: ethers.utils.parseEther('2')
  //     });
  //     // Impersonate escrowAuctions
  //     await ethers.provider.send('hardhat_impersonateAccount', [
  //       escrowAuctions.address
  //     ]);
  //     const impersonatedSigner = await ethers.getSigner(escrowAuctions.address);

  //     await expect(
  //       escrowListings
  //         .connect(impersonatedSigner)
  //         .transferForAuction(doArt.address, 1, buyer.address)
  //     )
  //       .to.emit(doArt, 'Transfer')// Expect Transfer event from DoArt contract
  //       .withArgs(escrowListings.address, buyer.address, 1);

  //     expect(await doArt.ownerOf(1)).to.equal(buyer.address);
  //     await ethers.provider.send('hardhat_stopImpersonatingAccount', [
  //       escrowAuctions.address
  //     ]);
  //   });

  it('Should allow EscrowAuctions to transfer NFT', async function () {
  // Verify DoArt is not paused
  expect(await doArt.paused()).to.be.false;

  // Verify NFT ownership before transfer
  expect(await doArt.ownerOf(1)).to.equal(escrowListings.address);

  // Verify approval for EscrowAuctions (for debugging)
  console.log('NFT Approval:', await doArt.getApproved(1));

  // Verify EscrowListings is not paused
  expect(await escrowListings.paused()).to.be.false;

  // Verify escrowAuctions address
  expect(await escrowListings.escrowAuctions()).to.equal(escrowAuctions.address);

  // Fund escrowAuctions to cover gas
  await owner.sendTransaction({
    to: escrowAuctions.address,
    value: ethers.utils.parseEther('2')
  });

  // Impersonate escrowAuctions
  await ethers.provider.send('hardhat_impersonateAccount', [escrowAuctions.address]);
  const impersonatedSigner = await ethers.getSigner(escrowAuctions.address);

  // Verify impersonated signer's address
  console.log('Impersonated Signer Address:', impersonatedSigner.address);

  // Attempt the transfer
  await expect(
    escrowListings
      .connect(impersonatedSigner)
      .transferForAuction(doArt.address, 1, buyer.address)
  )
    .to.emit(doArt, 'Transfer')
    .withArgs(escrowListings.address, buyer.address, 1);

  // Verify NFT ownership after transfer
  expect(await doArt.ownerOf(1)).to.equal(buyer.address);

  await ethers.provider.send('hardhat_stopImpersonatingAccount', [escrowAuctions.address]);
});

    it('Should revert if non-EscrowAuctions tries to transfer', async function () {
      await expect(
        escrowListings
          .connect(other)
          .transferForAuction(doArt.address, 1, buyer.address)
      ).to.be.revertedWith('Only EscrowAuctions');
    });
  });

  describe('Balance', function () {
    it('Should return correct contract balance', async function () {
      await escrowListings
        .connect(seller)
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
      await escrowListings
        .connect(buyer)
        .depositEarnest(doArt.address, 1, { value: escrowAmount });
      expect(await escrowListings.getBalance()).to.equal(escrowAmount);
    });
  });
});
