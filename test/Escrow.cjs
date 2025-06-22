// const { expect } = require('chai');
// const { ethers } = require('hardhat');

// describe('DoArt Contract', function () {
//   let DoArt, EscrowStorage, EscrowListings, EscrowLazyMinting, EscrowAuctions;
//   let doArt, escrowStorage, escrowListings, escrowLazyMinting, escrowAuctions;
//   let owner, artist, minter, other;
//   const metadataURI = 'ipfs://QmTest123';
//   const invalidURI = 'http://invalid.com';
//   const royaltyBps = 500; // 5%

//   beforeEach(async function () {
//     [owner, artist, minter, other] = await ethers.getSigners();

//     // Deploy DoArt with AddressZero as placeholder
//     DoArt = await ethers.getContractFactory('DoArt', owner);
//     doArt = await DoArt.deploy(ethers.constants.AddressZero);
//     await doArt.deployed();

//     // Deploy EscrowStorage with DoArt address
//     EscrowStorage = await ethers.getContractFactory('EscrowStorage', owner);
//     escrowStorage = await EscrowStorage.deploy(doArt.address);
//     await escrowStorage.deployed();

//     // Update DoArt with EscrowStorage address
//     await doArt.connect(owner).setStorageContract(escrowStorage.address);

//     // Deploy EscrowAuctions
//     EscrowAuctions = await ethers.getContractFactory('EscrowAuctions', owner);
//     escrowAuctions = await EscrowAuctions.deploy(
//       escrowStorage.address,
//       ethers.constants.AddressZero
//     );
//     await escrowAuctions.deployed();

//     // Deploy EscrowLazyMinting
//     EscrowLazyMinting = await ethers.getContractFactory(
//       'EscrowLazyMinting',
//       owner
//     );
//     escrowLazyMinting = await EscrowLazyMinting.deploy(escrowStorage.address);
//     await escrowLazyMinting.deployed();

//     // Deploy EscrowListings
//     EscrowListings = await ethers.getContractFactory('EscrowListings', owner);
//     escrowListings = await EscrowListings.deploy(
//       escrowStorage.address,
//       escrowAuctions.address
//     );
//     await escrowListings.deployed();

//     // Grant roles
//     await doArt.grantRole(await doArt.ARTIST_ROLE(), artist.address);
//     await doArt.grantRole(await doArt.PAUSER_ROLE(), owner.address);
//     await doArt.grantRole(await doArt.MINTER_ROLE(), minter.address);
//     await doArt.grantRole(await doArt.MINTER_ROLE(), escrowLazyMinting.address);
//     await escrowStorage.grantRole(
//       await escrowStorage.ADMIN_ROLE(),
//       doArt.address
//     );
//     await escrowStorage.grantRole(
//       await escrowStorage.ADMIN_ROLE(),
//       escrowListings.address
//     );
//     await escrowStorage.grantRole(
//       await escrowStorage.ADMIN_ROLE(),
//       escrowAuctions.address
//     );
//     await escrowStorage.grantRole(
//       await escrowStorage.ADMIN_ROLE(),
//       escrowLazyMinting.address
//     );
//   });

//   describe('Owner Role Initialization', function () {
//     it('Should set correct roles for owner', async function () {
//       expect(
//         await doArt.hasRole(await doArt.DEFAULT_ADMIN_ROLE(), owner.address)
//       ).to.be.true;
//       expect(await doArt.hasRole(await doArt.ARTIST_ROLE(), owner.address)).to
//         .be.true;
//       expect(await doArt.hasRole(await doArt.PAUSER_ROLE(), owner.address)).to
//         .be.true;
//       expect(await doArt.hasRole(await doArt.MINTER_ROLE(), owner.address)).to
//         .be.true;
//     });

//     it('Should set correct roles for artist and minter', async function () {
//       expect(await doArt.hasRole(await doArt.ARTIST_ROLE(), artist.address)).to
//         .be.true;
//       expect(await doArt.hasRole(await doArt.MINTER_ROLE(), minter.address)).to
//         .be.true;
//       expect(
//         await doArt.hasRole(
//           await doArt.MINTER_ROLE(),
//           escrowLazyMinting.address
//         )
//       ).to.be.true;
//     });
//   });

//   describe('Storage Contract Management', function () {
//     it('Should allow admin to update storage contract', async function () {
//       const newEscrowStorage = await EscrowStorage.deploy(doArt.address);
//       await newEscrowStorage.deployed();
//       await expect(
//         doArt.connect(owner).setStorageContract(newEscrowStorage.address)
//       ).to.not.be.reverted;
//       expect(await doArt.storageContract()).to.equal(newEscrowStorage.address);
//     });

//     it('Should revert if non-admin tries to update storage contract', async function () {
//       const newEscrowStorage = await EscrowStorage.deploy(doArt.address);
//       await newEscrowStorage.deployed();
//       await expect(
//         doArt.connect(other).setStorageContract(newEscrowStorage.address)
//       ).to.be.revertedWith(/AccessControl: account .* is missing role/);
//     });

//     it('Should revert if storage contract address is zero', async function () {
//       await expect(
//         doArt.connect(owner).setStorageContract(ethers.constants.AddressZero)
//       ).to.be.revertedWith('Invalid address');
//     });
//   });

//   describe('Artist Metadata', function () {
//     it('Should allow artist to set metadata', async function () {
//       const name = 'Artist Name';
//       const bio = 'Cool artist bio';
//       const portfolioUrl = 'https://portfolio.com';

//       await expect(
//         doArt.connect(artist).setArtistMetadata(name, bio, portfolioUrl)
//       )
//         .to.emit(doArt, 'ArtistMetadataUpdated')
//         .withArgs(artist.address, name, bio, portfolioUrl);

//       const [fetchedName, fetchedBio, fetchedUrl] =
//         await doArt.getArtistMetadata(artist.address);
//       expect(fetchedName).to.equal(name);
//       expect(fetchedBio).to.equal(bio);
//       expect(fetchedUrl).to.equal(portfolioUrl);
//     });

//     it('Should allow admin to set metadata', async function () {
//       const name = 'Admin Artist';
//       const bio = 'Admin bio';
//       const portfolioUrl = 'ipfs://QmAdmin123';

//       await expect(
//         doArt.connect(owner).setArtistMetadata(name, bio, portfolioUrl)
//       )
//         .to.emit(doArt, 'ArtistMetadataUpdated')
//         .withArgs(owner.address, name, bio, portfolioUrl);

//       const [fetchedName, fetchedBio, fetchedUrl] =
//         await doArt.getArtistMetadata(owner.address);
//       expect(fetchedName).to.equal(name);
//       expect(fetchedBio).to.equal(bio);
//       expect(fetchedUrl).to.equal(portfolioUrl);
//     });

//     it('Should revert if non-artist or non-admin tries to set metadata', async function () {
//       await expect(
//         doArt
//           .connect(other)
//           .setArtistMetadata('Name', 'Bio', 'https://test.com')
//       ).to.be.revertedWith('Caller is not artist or admin');
//     });

//     it('Should revert for invalid metadata inputs', async function () {
//       await expect(
//         doArt.connect(artist).setArtistMetadata('', 'Bio', 'https://test.com')
//       ).to.be.revertedWith('Name cannot be empty');

//       await expect(
//         doArt.connect(artist).setArtistMetadata('Name', 'Bio', invalidURI)
//       ).to.be.revertedWith(
//         'Invalid portfolio URL format: must start with https:// or ipfs://'
//       );

//       await expect(
//         doArt
//           .connect(artist)
//           .setArtistMetadata('A'.repeat(51), 'Bio', 'https://test.com')
//       ).to.be.revertedWith('Name too long');

//       await expect(
//         doArt
//           .connect(artist)
//           .setArtistMetadata('Name', 'B'.repeat(501), 'https://test.com')
//       ).to.be.revertedWith('Bio too long');

//       await expect(
//         doArt
//           .connect(artist)
//           .setArtistMetadata('Name', 'Bio', 'https://' + 'a'.repeat(193))
//       ).to.be.revertedWith('Portfolio URL too long');
//     });
//   });

//   describe('Minting', function () {
//     it('Should allow artist to mint NFT', async function () {
//       await expect(doArt.connect(artist).mint(metadataURI, royaltyBps))
//         .to.emit(doArt, 'TokenMinted')
//         .withArgs(artist.address, 1, metadataURI);

//       expect(await doArt.ownerOf(1)).to.equal(artist.address);
//       expect(await doArt.tokenURI(1)).to.equal(metadataURI);
//       const [, royaltyAmount] = await doArt.royaltyInfo(1, 10000);
//       expect(royaltyAmount).to.equal(royaltyBps);
//     });

//     it('Should revert if non-artist tries to mint', async function () {
//       await expect(
//         doArt.connect(other).mint(metadataURI, royaltyBps)
//       ).to.be.revertedWith(/AccessControl: account .* is missing role/);
//     });

//     it('Should revert for invalid mint inputs', async function () {
//       await expect(
//         doArt.connect(artist).mint('', royaltyBps)
//       ).to.be.revertedWith('Token URI cannot be empty');

//       await expect(
//         doArt.connect(artist).mint(invalidURI, royaltyBps)
//       ).to.be.revertedWith(
//         'Invalid metadata URI format: must start with https:// or ipfs://'
//       );

//       await expect(
//         doArt.connect(artist).mint(metadataURI, 10001)
//       ).to.be.revertedWith('Royalty must be <= 100%');

//       await expect(
//         doArt.connect(artist).mint('https://' + 'a'.repeat(193), royaltyBps)
//       ).to.be.revertedWith('Token URI too long');
//     });
//   });

//   describe('Minting for Escrow', function () {
//     it('Should allow minter to mint NFT for another address', async function () {
//       await expect(
//         doArt.connect(minter).mintFor(other.address, metadataURI, royaltyBps)
//       )
//         .to.emit(doArt, 'TokenMinted')
//         .withArgs(other.address, 1, metadataURI);

//       expect(await doArt.ownerOf(1)).to.equal(other.address);
//       expect(await doArt.tokenURI(1)).to.equal(metadataURI);
//       const [, royaltyAmount] = await doArt.royaltyInfo(1, 10000);
//       expect(royaltyAmount).to.equal(royaltyBps);
//     });

//     it('Should revert if non-minter tries to mintFor', async function () {
//       await expect(
//         doArt.connect(other).mintFor(other.address, metadataURI, royaltyBps)
//       ).to.be.revertedWith(/AccessControl: account .* is missing role/);
//     });
//   });

//   describe('Batch Minting', function () {
//     it('Should allow artist to batch mint NFTs', async function () {
//       const uris = [metadataURI, 'ipfs://QmTest456'];
//       const royalties = [royaltyBps, royaltyBps];

//       await expect(doArt.connect(artist).batchMint(uris, royalties))
//         .to.emit(doArt, 'TokenMinted')
//         .withArgs(artist.address, 1, uris[0])
//         .to.emit(doArt, 'TokenMinted')
//         .withArgs(artist.address, 2, uris[1]);

//       expect(await doArt.ownerOf(1)).to.equal(artist.address);
//       expect(await doArt.ownerOf(2)).to.equal(artist.address);
//       expect(await doArt.tokenURI(1)).to.equal(uris[0]);
//       expect(await doArt.tokenURI(2)).to.equal(uris[1]);
//     });

//     it('Should revert for invalid batch mint inputs', async function () {
//       await expect(doArt.connect(artist).batchMint([], [])).to.be.revertedWith(
//         'No metadata URIs provided'
//       );

//       await expect(
//         doArt.connect(artist).batchMint([metadataURI], [royaltyBps, royaltyBps])
//       ).to.be.revertedWith('Mismatched array lengths');

//       await expect(
//         doArt
//           .connect(artist)
//           .batchMint([metadataURI, metadataURI], [royaltyBps, 10001])
//       ).to.be.revertedWith('Royalty must be <= 100%');

//       await expect(
//         doArt
//           .connect(artist)
//           .batchMint(
//             new Array(51).fill(metadataURI),
//             new Array(51).fill(royaltyBps)
//           )
//       ).to.be.revertedWith('Batch size exceeds limit');
//     });
//   });

//   describe('Burning', function () {
//     it('Should allow owner to burn NFT', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await expect(doArt.connect(artist).burn(1))
//         .to.emit(doArt, 'TokenBurned')
//         .withArgs(1);

//       await expect(doArt.ownerOf(1)).to.be.revertedWith(
//         'ERC721: invalid token ID'
//       );
//     });

//     it('Should allow approved operator to burn NFT', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt.connect(artist).approve(other.address, 1);
//       await expect(doArt.connect(other).burn(1))
//         .to.emit(doArt, 'TokenBurned')
//         .withArgs(1);

//       await expect(doArt.ownerOf(1)).to.be.revertedWith(
//         'ERC721: invalid token ID'
//       );
//     });

//     it('Should revert if non-owner or non-approved tries to burn', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await expect(doArt.connect(other).burn(1)).to.be.revertedWith(
//         'Caller is not owner nor approved'
//       );
//     });

//     it('Should revert if token does not exist', async function () {
//       await expect(doArt.connect(artist).burn(999)).to.be.revertedWith(
//         'Token does not exist'
//       );
//     });
//   });

//   describe('Pausing', function () {
//     it('Should allow pauser to pause and unpause', async function () {
//       await doArt.connect(owner).pause();
//       expect(await doArt.paused()).to.be.true;

//       await expect(
//         doArt.connect(artist).mint(metadataURI, royaltyBps)
//       ).to.be.revertedWith('Pausable: paused');

//       await expect(
//         doArt
//           .connect(artist)
//           .setArtistMetadata('Name', 'Bio', 'https://test.com')
//       ).to.be.revertedWith('Pausable: paused');

//       await expect(doArt.connect(artist).burn(1)).to.be.revertedWith(
//         'Pausable: paused'
//       );

//       await doArt.connect(owner).unpause();
//       expect(await doArt.paused()).to.be.false;

//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       expect(await doArt.ownerOf(1)).to.equal(artist.address);
//     });

//     it('Should revert if non-pauser tries to pause', async function () {
//       await expect(doArt.connect(other).pause()).to.be.revertedWith(
//         /AccessControl: account .* is missing role/
//       );
//     });
//   });

//   describe('Royalties', function () {
//     it('Should set and retrieve royalty info', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       const [recipient, amount] = await doArt.royaltyInfo(1, 10000);
//       expect(recipient).to.equal(artist.address);
//       expect(amount).to.equal(royaltyBps);

//       const salePrice = ethers.utils.parseEther('1');
//       const [recipient2, amount2] = await doArt.royaltyInfo(1, salePrice);
//       expect(recipient2).to.equal(artist.address);
//       expect(amount2).to.equal(salePrice.mul(royaltyBps).div(10000));
//     });

//     it('Should allow admin to update royalty', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt.connect(owner).setTokenRoyalty(1, other.address, 1000);
//       const [recipient, amount] = await doArt.royaltyInfo(1, 10000);
//       expect(recipient).to.equal(other.address);
//       expect(amount).to.equal(1000);
//     });

//     it('Should revert if non-admin tries to update royalty', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await expect(
//         doArt.connect(other).setTokenRoyalty(1, other.address, 1000)
//       ).to.be.revertedWith(/AccessControl: account .* is missing role/);
//     });

//     it('Should revert if royalty exceeds 100%', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await expect(
//         doArt.connect(owner).setTokenRoyalty(1, other.address, 10001)
//       ).to.be.revertedWith('Royalty must be <= 100%');
//     });
//   });

//   describe('Utility Functions', function () {
//     it('Should return correct total supply', async function () {
//       expect(await doArt.totalSupply()).to.equal(0);
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       expect(await doArt.totalSupply()).to.equal(1);
//       await doArt.connect(artist).mint('ipfs://QmTest456', royaltyBps);
//       expect(await doArt.totalSupply()).to.equal(2);
//     });

//     it('Should return tokens of owner', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt.connect(artist).mint('ipfs://QmTest456', royaltyBps);
//       const tokens = await doArt.getTokensOfOwner(artist.address);
//       expect(tokens.map((t) => t.toNumber())).to.have.members([1, 2]);
//     });

//     it('Should exclude burned tokens from owner tokens', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt.connect(artist).burn(1);
//       const tokens = await doArt.getTokensOfOwner(artist.address);
//       expect(tokens).to.have.length(0);
//     });

//     it('Should return empty array for owner with no tokens', async function () {
//       const tokens = await doArt.getTokensOfOwner(other.address);
//       expect(tokens).to.have.length(0);
//     });

//     it('Should return token details', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       const [ownerAddr, uri, royaltyRecipient, bps] =
//         await doArt.getTokenDetails(1);
//       expect(ownerAddr).to.equal(artist.address);
//       expect(uri).to.equal(metadataURI);
//       expect(royaltyRecipient).to.equal(artist.address);
//       expect(bps).to.equal(royaltyBps);
//     });

//     it('Should revert for non-existent token details', async function () {
//       await expect(doArt.getTokenDetails(999)).to.be.revertedWith(
//         'Token does not exist'
//       );
//     });

//     it('Should handle batch minting up to limit', async function () {
//       const uris = new Array(50).fill(metadataURI);
//       const royalties = new Array(50).fill(royaltyBps);
//       await expect(doArt.connect(artist).batchMint(uris, royalties)).to.not.be
//         .reverted;
//       expect(await doArt.totalSupply()).to.equal(50);
//     });

//     it('Should support required interfaces', async function () {
//       expect(await doArt.supportsInterface('0x80ac58cd')).to.be.true; // IERC721
//       expect(await doArt.supportsInterface('0x5b5e139f')).to.be.true; // IERC721Metadata
//       expect(await doArt.supportsInterface('0x2a55205a')).to.be.true; // IERC2981
//       expect(await doArt.supportsInterface('0x7965db0b')).to.be.true; // IAccessControl
//     });
//   });

//   describe('Role Management', function () {
//     it('Should allow admin to grant and revoke roles', async function () {
//       await doArt
//         .connect(owner)
//         .grantRole(await doArt.ARTIST_ROLE(), other.address);
//       expect(await doArt.hasRole(await doArt.ARTIST_ROLE(), other.address)).to
//         .be.true;
//       await doArt
//         .connect(owner)
//         .revokeRole(await doArt.ARTIST_ROLE(), other.address);
//       expect(await doArt.hasRole(await doArt.ARTIST_ROLE(), other.address)).to
//         .be.false;
//     });
//   });

//   describe('Lazy Minting', function () {
//     it('Should redeem lazy mint voucher and mint NFT', async function () {
//       const voucher = {
//         tokenId: 1,
//         creator: artist.address,
//         price: ethers.utils.parseEther('1'),
//         uri: metadataURI,
//         royaltyBps: royaltyBps,
//         signature: '0x'
//       };

//       const domain = {
//         name: 'DoArtNFTPlatform',
//         version: '1',
//         chainId: await ethers.provider.getNetwork().then((net) => net.chainId),
//         verifyingContract: escrowLazyMinting.address
//       };
//       const types = {
//         LazyMintVoucher: [
//           { name: 'tokenId', type: 'uint256' },
//           { name: 'creator', type: 'address' },
//           { name: 'price', type: 'uint256' },
//           { name: 'uri', type: 'string' },
//           { name: 'royaltyBps', type: 'uint96' }
//         ]
//       };
//       const signature = await artist._signTypedData(domain, types, voucher);
//       voucher.signature = signature;

//       await expect(
//         escrowLazyMinting
//           .connect(other)
//           .redeemLazyMint(doArt.address, voucher, {
//             value: ethers.utils.parseEther('1')
//           })
//       )
//         .to.emit(doArt, 'TokenMinted')
//         .withArgs(other.address, 1, metadataURI)
//         .to.emit(escrowLazyMinting, 'LazyMintRedeemed')
//         .withArgs(
//           doArt.address,
//           voucher.tokenId,

//           other.address,
//           ethers.utils.parseEther('1'),
//           artist.address
//         );

//       expect(await doArt.ownerOf(1)).to.equal(other.address);
//       expect(await doArt.tokenURI(1)).to.equal(metadataURI);
//       expect(
//         await escrowStorage.getVoucherRedeemed(doArt.address, voucher.tokenId)
//       ).to.be.true;
//     });

//     it('Should revert if voucher is already redeemed', async function () {
//       const voucher = {
//         tokenId: 1,
//         creator: artist.address,
//         price: ethers.utils.parseEther('1'),
//         uri: metadataURI,
//         royaltyBps: royaltyBps,
//         signature: '0x'
//       };

//       const domain = {
//         name: 'DoArtNFTPlatform',
//         version: '1',
//         chainId: await ethers.provider.getNetwork().then((net) => net.chainId),
//         verifyingContract: escrowLazyMinting.address
//       };
//       const types = {
//         LazyMintVoucher: [
//           { name: 'tokenId', type: 'uint256' },
//           { name: 'creator', type: 'address' },
//           { name: 'price', type: 'uint256' },
//           { name: 'uri', type: 'string' },
//           { name: 'royaltyBps', type: 'uint96' }
//         ]
//       };
//       const signature = await artist._signTypedData(domain, types, voucher);
//       voucher.signature = signature;

//       await escrowLazyMinting
//         .connect(other)
//         .redeemLazyMint(doArt.address, voucher, {
//           value: ethers.utils.parseEther('1')
//         });
//       await expect(
//         escrowLazyMinting
//           .connect(other)
//           .redeemLazyMint(doArt.address, voucher, {
//             value: ethers.utils.parseEther('1')
//           })
//       ).to.be.revertedWith('Voucher already redeemed');
//     });
//   });

//   describe('Listings', function () {
//     it('Should list NFT for sale', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt
//         .connect(artist)
//         .setApprovalForAll(escrowListings.address, true);

//       const params = {
//         nftContract: doArt.address,
//         tokenId: 1,
//         buyer: ethers.constants.AddressZero,
//         price: ethers.utils.parseEther('1'),
//         minBid: 0,
//         escrowAmount: ethers.utils.parseEther('0.1'),
//         isAuction: false,
//         auctionDuration: 0
//       };

//       await expect(
//         escrowListings
//           .connect(artist)
//           .list(
//             params.nftContract,
//             params.tokenId,
//             params.buyer,
//             params.price,
//             params.minBid,
//             params.escrowAmount,
//             params.isAuction,
//             params.auctionDuration
//           )
//       )
//         .to.emit(escrowListings, 'NFTListed')
//         .withArgs(
//           doArt.address,
//           1,
//           artist.address,
//           params.buyer,
//           params.price,
//           params.minBid,
//           params.escrowAmount,
//           params.isAuction,
//           params.auctionDuration
//         );

//       const listing = await escrowStorage.getListing(doArt.address, 1);
//       expect(listing.isListed).to.be.true;
//       expect(listing.price).to.equal(params.price);
//       expect(listing.isAuction).to.be.false;
//       expect(listing.seller).to.equal(artist.address);
//     });

//     it('Should list NFT for auction', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt
//         .connect(artist)
//         .setApprovalForAll(escrowListings.address, true);

//       const params = {
//         nftContract: doArt.address,
//         tokenId: 1,
//         buyer: ethers.constants.AddressZero,
//         price: 0,
//         minBid: ethers.utils.parseEther('0.5'),
//         escrowAmount: ethers.utils.parseEther('0.1'),
//         isAuction: true,
//         auctionDuration: 86400
//       };

//       await expect(
//         escrowListings
//           .connect(artist)
//           .list(
//             params.nftContract,
//             params.tokenId,
//             params.buyer,
//             params.price,
//             params.minBid,
//             params.escrowAmount,
//             params.isAuction,
//             params.auctionDuration
//           )
//       )
//         .to.emit(escrowListings, 'NFTListed')
//         .withArgs(
//           doArt.address,
//           1,
//           artist.address,
//           params.buyer,
//           params.price,
//           params.minBid,
//           params.escrowAmount,
//           params.isAuction,
//           params.auctionDuration
//         );

//       const listing = await escrowStorage.getListing(doArt.address, 1);
//       expect(listing.isListed).to.be.true;
//       expect(listing.isAuction).to.be.true;
//       expect(listing.minBid).to.equal(params.minBid);

//       const auction = await escrowStorage.getAuction(doArt.address, 1);
//       expect(auction.isActive).to.be.true;
//       expect(auction.minBid).to.equal(params.minBid);
//     });

//     it('Should batch list NFTs for sale and auction', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt.connect(artist).mint('ipfs://QmTest456', royaltyBps);
//       await doArt
//         .connect(artist)
//         .setApprovalForAll(escrowListings.address, true);

//       const params = [
//         {
//           nftContract: doArt.address,
//           tokenId: 1,
//           buyer: ethers.constants.AddressZero,
//           price: ethers.utils.parseEther('1'),
//           minBid: 0,
//           escrowAmount: ethers.utils.parseEther('0.1'),
//           isAuction: false,
//           auctionDuration: 0
//         },
//         {
//           nftContract: doArt.address,
//           tokenId: 2,
//           buyer: ethers.constants.AddressZero,
//           price: 0,
//           minBid: ethers.utils.parseEther('0.5'),
//           escrowAmount: ethers.utils.parseEther('0.1'),
//           isAuction: true,
//           auctionDuration: 86400
//         }
//       ];

//       await expect(escrowListings.connect(artist).batchList(params))
//         .to.emit(escrowListings, 'NFTListed')
//         .withArgs(
//           doArt.address,
//           1,
//           artist.address,
//           params[0].buyer,
//           params[0].price,
//           params[0].minBid,
//           params[0].escrowAmount,
//           params[0].isAuction,
//           params[0].auctionDuration
//         )
//         .to.emit(escrowListings, 'NFTListed')
//         .withArgs(
//           doArt.address,
//           2,
//           artist.address,
//           params[1].buyer,
//           params[1].price,
//           params[1].minBid,
//           params[1].escrowAmount,
//           params[1].isAuction,
//           params[1].auctionDuration
//         );
//     });
//   });

//   describe('Auctions', function () {
//     it('Should allow bidding on an auction', async function () {
//       await doArt.connect(artist).mint(metadataURI, royaltyBps);
//       await doArt
//         .connect(artist)
//         .setApprovalForAll(escrowListings.address, true);

//       const params = {
//         nftContract: doArt.address,
//         tokenId: 1,
//         buyer: ethers.constants.AddressZero,
//         price: 0,
//         minBid: ethers.utils.parseEther('0.5'),
//         escrowAmount: ethers.utils.parseEther('0.1'),
//         isAuction: true,
//         auctionDuration: 86400
//       };

//       await escrowListings
//         .connect(artist)
//         .list(
//           params.nftContract,
//           params.tokenId,
//           params.buyer,
//           params.price,
//           params.minBid,
//           params.escrowAmount,
//           params.isAuction,
//           params.auctionDuration
//         );

//       const bidAmount = ethers.utils.parseEther('1');
//       await expect(
//         escrowAuctions
//           .connect(other)
//           .batchPlaceAuctionBid(doArt.address, [1], [bidAmount], {
//             value: bidAmount
//           })
//       )
//         .to.emit(escrowStorage, 'BidChanged')
//         .withArgs(doArt.address, 1)
//         .to.emit(escrowAuctions, 'BidPlaced')
//         .withArgs(doArt.address, 1, other.address, bidAmount);

//       const bids = await escrowStorage.getBids(doArt.address, 1);
//       expect(bids).to.have.length(1);
//       expect(bids[0].bidder).to.equal(other.address);
//       expect(bids[0].amount).to.equal(bidAmount);
//     });
//   });
// });
