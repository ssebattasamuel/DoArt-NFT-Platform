const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('DoArt Contract', function () {
  let DoArt, doArt, owner, artist, minter, other;
  const metadataURI = 'ipfs://QmTest123';
  const invalidURI = 'http://invalid.com';
  const royaltyBps = 500; // 5%

  beforeEach(async function () {
    [owner, artist, minter, other] = await ethers.getSigners();
    DoArt = await ethers.getContractFactory('DoArt');
    doArt = await DoArt.deploy();
    await doArt.deployed();

    // Grant roles
    await doArt.grantRole(await doArt.ARTIST_ROLE(), artist.address);
    await doArt.grantRole(await doArt.PAUSER_ROLE(), owner.address);
    await doArt.grantRole(await doArt.MINTER_ROLE(), minter.address);
  });

  describe('Deployment', function () {
    it('Should set correct roles for owner', async function () {
      expect(
        await doArt.hasRole(await doArt.DEFAULT_ADMIN_ROLE(), owner.address)
      ).to.be.true;
      expect(await doArt.hasRole(await doArt.ARTIST_ROLE(), owner.address)).to
        .be.true;
      expect(await doArt.hasRole(await doArt.PAUSER_ROLE(), owner.address)).to
        .be.true;
      expect(await doArt.hasRole(await doArt.MINTER_ROLE(), owner.address)).to
        .be.true;
    });
  });

  describe('Artist Metadata', function () {
    it('Should allow artist to set metadata', async function () {
      const name = 'Artist Name';
      const bio = 'Cool artist bio';
      const portfolioUrl = 'https://portfolio.com';

      await expect(
        doArt.connect(artist).setArtistMetadata(name, bio, portfolioUrl)
      )
        .to.emit(doArt, 'ArtistMetadataUpdated')
        .withArgs(artist.address, name, bio, portfolioUrl);

      const [fetchedName, fetchedBio, fetchedUrl] =
        await doArt.getArtistMetadata(artist.address);
      expect(fetchedName).to.equal(name);
      expect(fetchedBio).to.equal(bio);
      expect(fetchedUrl).to.equal(portfolioUrl);
    });

    it('Should revert if non-artist tries to set metadata', async function () {
      await expect(
        doArt
          .connect(other)
          .setArtistMetadata('Name', 'Bio', 'https://test.com')
      ).to.be.revertedWith('Caller is not artist or admin');
    });

    it('Should revert for invalid metadata inputs', async function () {
      await expect(
        doArt.connect(artist).setArtistMetadata('', 'Bio', 'https://test.com')
      ).to.be.revertedWith('Name cannot be empty');

      await expect(
        doArt.connect(artist).setArtistMetadata('Name', 'Bio', invalidURI)
      ).to.be.revertedWith(
        'Invalid portfolio URL format: must start with https:// or ipfs://'
      );
    });
  });

  describe('Minting', function () {
    it('Should allow artist to mint NFT', async function () {
      await expect(doArt.connect(artist).mint(metadataURI, royaltyBps))
        .to.emit(doArt, 'TokenMinted')
        .withArgs(artist.address, 1, metadataURI);

      expect(await doArt.ownerOf(1)).to.equal(artist.address);
      expect(await doArt.tokenURI(1)).to.equal(metadataURI);
      const [, royaltyAmount] = await doArt.royaltyInfo(1, 10000);
      expect(royaltyAmount).to.equal(royaltyBps);
    });

    it('Should revert if non-artist tries to mint', async function () {
      await expect(
        doArt.connect(other).mint(metadataURI, royaltyBps)
      ).to.be.revertedWith(
        'AccessControl: account ' +
          other.address.toLowerCase() +
          ' is missing role 0x877a78dc988c0ec5f58453b44888a55eb39755c3d5ed8d8ea990912aa3ef29c6'
      );
    });

    it('Should revert for invalid mint inputs', async function () {
      await expect(
        doArt.connect(artist).mint('', royaltyBps)
      ).to.be.revertedWith('Token URI cannot be empty');

      await expect(
        doArt.connect(artist).mint(invalidURI, royaltyBps)
      ).to.be.revertedWith(
        'Invalid metadata URI format: must start with https:// or ipfs://'
      );

      await expect(
        doArt.connect(artist).mint(metadataURI, 10001)
      ).to.be.revertedWith('Royalty must be <= 100%');
    });
  });

  describe('Minting for Escrow', function () {
    it('Should allow minter to mint NFT for another address', async function () {
      await expect(
        doArt.connect(minter).mintFor(other.address, metadataURI, royaltyBps)
      )
        .to.emit(doArt, 'TokenMinted')
        .withArgs(other.address, 1, metadataURI);

      expect(await doArt.ownerOf(1)).to.equal(other.address);
      expect(await doArt.tokenURI(1)).to.equal(metadataURI);
      const [, royaltyAmount] = await doArt.royaltyInfo(1, 10000);
      expect(royaltyAmount).to.equal(royaltyBps);
    });

    it('Should revert if non-minter tries to mintFor', async function () {
      await expect(
        doArt.connect(other).mintFor(other.address, metadataURI, royaltyBps)
      ).to.be.revertedWith(
        'AccessControl: account ' +
          other.address.toLowerCase() +
          ' is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      );
    });
  });

  describe('Batch Minting', function () {
    it('Should allow artist to batch mint NFTs', async function () {
      const uris = [metadataURI, 'ipfs://QmTest456'];
      const royalties = [royaltyBps, royaltyBps];

      const tx = await doArt.connect(artist).batchMint(uris, royalties);
      const receipt = await tx.wait();
      const tokenIds = receipt.events
        .filter((e) => e.event === 'TokenMinted')
        .map((e) => e.args.tokenId);

      expect(tokenIds).to.have.length(2);
      expect(await doArt.ownerOf(1)).to.equal(artist.address);
      expect(await doArt.ownerOf(2)).to.equal(artist.address);
      expect(await doArt.tokenURI(1)).to.equal(uris[0]);
      expect(await doArt.tokenURI(2)).to.equal(uris[1]);
    });

    it('Should revert for invalid batch mint inputs', async function () {
      await expect(doArt.connect(artist).batchMint([], [])).to.be.revertedWith(
        'No metadata URIs provided'
      );

      await expect(
        doArt.connect(artist).batchMint([metadataURI], [royaltyBps, royaltyBps])
      ).to.be.revertedWith('Mismatched array lengths');
    });
  });

  describe('Burning', function () {
    it('Should allow owner to burn NFT', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await expect(doArt.connect(artist).burn(1))
        .to.emit(doArt, 'TokenBurned')
        .withArgs(1);

      await expect(doArt.ownerOf(1)).to.be.revertedWith(
        'ERC721: invalid token ID'
      );
    });

    it('Should revert if non-owner tries to burn', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await expect(doArt.connect(other).burn(1)).to.be.revertedWith(
        'Caller is not owner nor approved'
      );
    });
  });

  describe('Pausing', function () {
    it('Should allow pauser to pause and unpause', async function () {
      await doArt.connect(owner).pause();
      expect(await doArt.paused()).to.be.true;

      await expect(
        doArt.connect(artist).mint(metadataURI, royaltyBps)
      ).to.be.revertedWith('Pausable: paused');

      await doArt.connect(owner).unpause();
      expect(await doArt.paused()).to.be.false;

      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      expect(await doArt.ownerOf(1)).to.equal(artist.address);
    });

    it('Should revert if non-pauser tries to pause', async function () {
      await expect(doArt.connect(other).pause()).to.be.revertedWith(
        'AccessControl: account ' +
          other.address.toLowerCase() +
          ' is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a'
      );
    });
  });

  describe('Royalties', function () {
    it('Should set and retrieve royalty info', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      const [recipient, amount] = await doArt.royaltyInfo(1, 10000);
      expect(recipient).to.equal(artist.address);
      expect(amount).to.equal(royaltyBps);

      // Test with different sale price
      const salePrice = ethers.utils.parseEther('1');
      const [recipient2, amount2] = await doArt.royaltyInfo(1, salePrice);
      expect(recipient2).to.equal(artist.address);
      expect(amount2).to.equal(salePrice.mul(royaltyBps).div(10000));
    });

    it('Should allow admin to update royalty', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(owner).setTokenRoyalty(1, other.address, 1000);
      const [recipient, amount] = await doArt.royaltyInfo(1, 10000);
      expect(recipient).to.equal(other.address);
      expect(amount).to.equal(1000);
    });
  });

  describe('Utility Functions', function () {
    it('Should return correct total supply', async function () {
      expect(await doArt.totalSupply()).to.equal(0);
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      expect(await doArt.totalSupply()).to.equal(1);
    });

    it('Should return tokens of owner', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      await doArt.connect(artist).mint('ipfs://QmTest456', royaltyBps);
      const tokens = await doArt.getTokensOfOwner(artist.address);
      expect(tokens.map((t) => t.toNumber())).to.have.members([1, 2]);
    });

    it('Should return token details', async function () {
      await doArt.connect(artist).mint(metadataURI, royaltyBps);
      const [ownerAddr, uri, royaltyRecipient, bps] =
        await doArt.getTokenDetails(1);
      expect(ownerAddr).to.equal(artist.address);
      expect(uri).to.equal(metadataURI);
      expect(royaltyRecipient).to.equal(artist.address);
      expect(bps).to.equal(royaltyBps);
    });
  });
});
