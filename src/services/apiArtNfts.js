// import { ethers } from 'ethers';
// import { uploadToPinata } from './pinata';
// import { toast } from 'react-hot-toast';
// import { convertUsdToEth } from '../utils/priceConverter';

// // export async function createNft(
// //   { title, purchasePrice, description, image, royaltyBps = 500 },
// //   { doArt, escrowListings }
// // ) {
// //   try {
// //     if (!doArt?.signer || !escrowListings?.signer) {
// //       throw new Error('Signer not connected to contracts');
// //     }
// //     console.log('createNft: Starting mint process', {
// //       title,
// //       purchasePrice,
// //       description,
// //       royaltyBps
// //     });
// //     const imageUri = await uploadToPinata(image);
// //     const metadata = { name: title, description, image: imageUri };
// //     const metadataUri = await uploadToPinata(metadata, true);

// //     console.log('createNft: Minting NFT with URI', metadataUri);
// //     const mintTx = await doArt.mint(metadataUri, royaltyBps);
// //     const receipt = await mintTx.wait();
// //     const tokenId = receipt.events
// //       .find((e) => e.event === 'Transfer')
// //       ?.args?.tokenId.toString();
// //     console.log('createNft: Minted NFT, tokenId:', tokenId);

// //     console.log('createNft: Approving EscrowListings for tokenId:', tokenId);
// //     const approveTx = await doArt.approve(escrowListings.address, tokenId);
// //     await approveTx.wait();

// //     const price = ethers.utils.parseEther(purchasePrice.toString());
// //     const escrowAmount = ethers.utils.parseEther('0.01');
// //     console.log('createNft: Listing NFT with price:', purchasePrice);
// //     const listTx = await escrowListings.list(
// //       doArt.address,
// //       tokenId,
// //       ethers.constants.AddressZero,
// //       price,
// //       0,
// //       escrowAmount,
// //       false,
// //       0
// //     );
// //     await listTx.wait();
// //     console.log('createNft: Listed NFT, tokenId:', tokenId);

// //     return {
// //       tokenId,
// //       title,
// //       purchasePrice,
// //       description,
// //       imageUri,
// //       metadataUri
// //     };
// //   } catch (err) {
// //     console.error('createNft error:', err.message, err.stack);
// //     throw err;
// //   }
// // }

// export async function createNft(
//   { title, purchasePrice, description, image, royaltyBps = 500, isUsd = false },
//   { doArt, escrowListings }
// ) {
//   try {
//     if (!doArt?.signer || !escrowListings?.signer) {
//       throw new Error('Signer not connected to contracts');
//     }
//     console.log('createNft: Starting mint process', {
//       title,
//       purchasePrice,
//       description,
//       royaltyBps,
//       isUsd
//     });
//     const imageUri = await uploadToPinata(image);
//     const metadata = { name: title, description, image: imageUri };
//     const metadataUri = await uploadToPinata(metadata, true);

//     console.log('createNft: Minting NFT with URI', metadataUri);
//     const mintTx = await doArt.mint(metadataUri, royaltyBps);
//     const receipt = await mintTx.wait();
//     const tokenId = receipt.events
//       .find((e) => e.event === 'Transfer')
//       ?.args?.tokenId.toString();
//     console.log('createNft: Minted NFT, tokenId:', tokenId);

//     console.log('createNft: Approving EscrowListings for tokenId:', tokenId);
//     const approveTx = await doArt.approve(escrowListings.address, tokenId);
//     await approveTx.wait();

//     const priceInWei = isUsd
//       ? (await convertUsdToEth(purchasePrice)).weiAmount
//       : ethers.utils.parseEther(purchasePrice.toString());
//     const escrowAmount = ethers.utils.parseEther('0.01');
//     console.log('createNft: Listing NFT with price:', priceInWei);
//     const listTx = await escrowListings.list(
//       doArt.address,
//       tokenId,
//       ethers.constants.AddressZero,
//       priceInWei,
//       0,
//       escrowAmount,
//       false,
//       0
//     );
//     await listTx.wait();
//     console.log('createNft: Listed NFT, tokenId:', tokenId);

//     return {
//       tokenId,
//       title,
//       purchasePrice,
//       description,
//       imageUri,
//       metadataUri
//     };
//   } catch (err) {
//     console.error('createNft error:', err.message, err.stack);
//     throw err;
//   }
// }

// // export async function batchMintNfts(nfts, { doArt, escrowListings }) {
// //   try {
// //     if (!doArt?.signer || !escrowListings?.signer) {
// //       throw new Error('Signer not connected to contracts');
// //     }
// //     const tokenIds = [];
// //     const imageURIs = [];
// //     for (const nft of nfts) {
// //       const {
// //         title,
// //         description,
// //         image,
// //         royaltyBps = 500,
// //         purchasePrice
// //       } = nft;
// //       console.log('batchMintNfts: Starting mint for NFT', {
// //         title,
// //         purchasePrice,
// //         description,
// //         royaltyBps
// //       });
// //       const imageUri = await uploadToPinata(image);
// //       const metadata = { name: title, description, image: imageUri };
// //       const metadataUri = await uploadToPinata(metadata, true);

// //       console.log('batchMintNfts: Minting NFT with URI', metadataUri);
// //       const mintTx = await doArt.mint(metadataUri, royaltyBps);
// //       const receipt = await mintTx.wait();
// //       const tokenId = receipt.events
// //         .find((e) => e.event === 'Transfer')
// //         ?.args?.tokenId.toString();
// //       tokenIds.push(tokenId);
// //       console.log('batchMintNfts: Minted NFT, tokenId:', tokenId);

// //       console.log(
// //         'batchMintNfts: Approving EscrowListings for tokenId:',
// //         tokenId
// //       );
// //       const approveTx = await doArt.approve(escrowListings.address, tokenId);
// //       await approveTx.wait();

// //       if (purchasePrice) {
// //         const price = ethers.utils.parseEther(purchasePrice.toString());
// //         const escrowAmount = ethers.utils.parseEther('0.01');
// //         console.log('batchMintNfts: Listing NFT with price:', purchasePrice);
// //         const listTx = await escrowListings.list(
// //           doArt.address,
// //           tokenId,
// //           ethers.constants.AddressZero,
// //           price,
// //           0,
// //           escrowAmount,
// //           false,
// //           0
// //         );
// //         await listTx.wait();
// //         console.log('batchMintNfts: Listed NFT, tokenId:', tokenId);
// //       }
// //       imageURIs.push(imageUri);
// //     }
// //     return { tokenIds, imageURIs };
// //   } catch (err) {
// //     console.error('batchMintNfts error:', err.message, err.stack);
// //     throw err;
// //   }
// // }
// export async function batchMintNfts(nfts, { doArt, escrowListings }) {
//   try {
//     if (!doArt?.signer || !escrowListings?.signer) {
//       throw new Error('Signer not connected to contracts');
//     }
//     const tokenIds = [];
//     const imageURIs = [];
//     for (const nft of nfts) {
//       const {
//         title,
//         description,
//         image,
//         royaltyBps = 500,
//         purchasePrice,
//         isUsd = false
//       } = nft;
//       console.log('batchMintNfts: Starting mint for NFT', {
//         title,
//         purchasePrice,
//         description,
//         royaltyBps,
//         isUsd
//       });
//       const imageUri = await uploadToPinata(image);
//       const metadata = { name: title, description, image: imageUri };
//       const metadataUri = await uploadToPinata(metadata, true);

//       console.log('batchMintNfts: Minting NFT with URI', metadataUri);
//       const mintTx = await doArt.mint(metadataUri, royaltyBps);
//       const receipt = await mintTx.wait();
//       const tokenId = receipt.events
//         .find((e) => e.event === 'Transfer')
//         ?.args?.tokenId.toString();
//       tokenIds.push(tokenId);
//       console.log('batchMintNfts: Minted NFT, tokenId:', tokenId);

//       console.log(
//         'batchMintNfts: Approving EscrowListings for tokenId:',
//         tokenId
//       );
//       const approveTx = await doArt.approve(escrowListings.address, tokenId);
//       await approveTx.wait();

//       if (purchasePrice) {
//         const priceInWei = isUsd
//           ? (await convertUsdToEth(purchasePrice)).weiAmount
//           : ethers.utils.parseEther(purchasePrice.toString());
//         const escrowAmount = ethers.utils.parseEther('0.01');
//         console.log('batchMintNfts: Listing NFT with price:', priceInWei);
//         const listTx = await escrowListings.list(
//           doArt.address,
//           tokenId,
//           ethers.constants.AddressZero,
//           priceInWei,
//           0,
//           escrowAmount,
//           false,
//           0
//         );
//         await listTx.wait();
//         console.log('batchMintNfts: Listed NFT, tokenId:', tokenId);
//       }
//       imageURIs.push(imageUri);
//     }
//     return { tokenIds, imageURIs };
//   } catch (err) {
//     console.error('batchMintNfts error:', err.message, err.stack);
//     throw err;
//   }
// }
import { ethers } from 'ethers';
import { uploadToPinata } from './pinata';
import { toast } from 'react-hot-toast';
import { convertUsdToEth } from '../utils/priceConverter';

const TRANSACTION_TIMEOUT = 60000; // 60 seconds

async function withTimeout(promise, timeoutMs) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Transaction timed out')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

export async function createNft(
  { title, purchasePrice, description, image, royaltyBps = 500, isUsd = false },
  { doArt, escrowListings }
) {
  try {
    if (!doArt?.signer || !escrowListings?.signer) {
      throw new Error('Signer not connected to contracts');
    }
    console.log('createNft: Starting mint process', {
      title,
      purchasePrice,
      description,
      royaltyBps,
      isUsd
    });
    const imageUri = await withTimeout(
      uploadToPinata(image),
      TRANSACTION_TIMEOUT
    );
    const metadata = { name: title, description, image: imageUri };
    const metadataUri = await withTimeout(
      uploadToPinata(metadata, true),
      TRANSACTION_TIMEOUT
    );

    console.log('createNft: Minting NFT with URI', metadataUri);
    const mintTx = await withTimeout(
      doArt.mint(metadataUri, royaltyBps),
      TRANSACTION_TIMEOUT
    );
    const receipt = await withTimeout(mintTx.wait(), TRANSACTION_TIMEOUT);
    const tokenId = receipt.events
      .find((e) => e.event === 'Transfer')
      ?.args?.tokenId.toString();
    console.log('createNft: Minted NFT, tokenId:', tokenId);

    console.log('createNft: Approving EscrowListings for tokenId:', tokenId);
    const approveTx = await withTimeout(
      doArt.approve(escrowListings.address, tokenId),
      TRANSACTION_TIMEOUT
    );
    await withTimeout(approveTx.wait(), TRANSACTION_TIMEOUT);

    const priceInWei = isUsd
      ? (await convertUsdToEth(purchasePrice)).weiAmount
      : ethers.utils.parseEther(purchasePrice.toString());
    const escrowAmount = ethers.utils.parseEther('0.01');
    console.log('createNft: Listing NFT with price:', priceInWei);
    const listTx = await withTimeout(
      escrowListings.list(
        doArt.address,
        tokenId,
        ethers.constants.AddressZero,
        priceInWei,
        0,
        escrowAmount,
        false,
        0
      ),
      TRANSACTION_TIMEOUT
    );
    await withTimeout(listTx.wait(), TRANSACTION_TIMEOUT);
    console.log('createNft: Listed NFT, tokenId:', tokenId);

    return {
      tokenId,
      title,
      purchasePrice,
      description,
      imageUri,
      metadataUri
    };
  } catch (err) {
    console.error('createNft error:', err.message, err.stack);
    throw err;
  }
}

export async function batchMintNfts(nfts, { doArt, escrowListings }) {
  try {
    if (!doArt?.signer || !escrowListings?.signer) {
      throw new Error('Signer not connected to contracts');
    }
    const tokenIds = [];
    const imageURIs = [];
    for (const nft of nfts) {
      const {
        title,
        description,
        image,
        royaltyBps = 500,
        purchasePrice,
        isUsd = false
      } = nft;
      console.log('batchMintNfts: Starting mint for NFT', {
        title,
        purchasePrice,
        description,
        royaltyBps,
        isUsd
      });
      const imageUri = await withTimeout(
        uploadToPinata(image),
        TRANSACTION_TIMEOUT
      );
      const metadata = { name: title, description, image: imageUri };
      const metadataUri = await withTimeout(
        uploadToPinata(metadata, true),
        TRANSACTION_TIMEOUT
      );

      console.log('batchMintNfts: Minting NFT with URI', metadataUri);
      const mintTx = await withTimeout(
        doArt.mint(metadataUri, royaltyBps),
        TRANSACTION_TIMEOUT
      );
      const receipt = await withTimeout(mintTx.wait(), TRANSACTION_TIMEOUT);
      const tokenId = receipt.events
        .find((e) => e.event === 'Transfer')
        ?.args?.tokenId.toString();
      tokenIds.push(tokenId);
      console.log('batchMintNfts: Minted NFT, tokenId:', tokenId);

      console.log(
        'batchMintNfts: Approving EscrowListings for tokenId:',
        tokenId
      );
      const approveTx = await withTimeout(
        doArt.approve(escrowListings.address, tokenId),
        TRANSACTION_TIMEOUT
      );
      await withTimeout(approveTx.wait(), TRANSACTION_TIMEOUT);

      if (purchasePrice) {
        const priceInWei = isUsd
          ? (await convertUsdToEth(purchasePrice)).weiAmount
          : ethers.utils.parseEther(purchasePrice.toString());
        const escrowAmount = ethers.utils.parseEther('0.01');
        console.log('batchMintNfts: Listing NFT with price:', priceInWei);
        const listTx = await withTimeout(
          escrowListings.list(
            doArt.address,
            tokenId,
            ethers.constants.AddressZero,
            priceInWei,
            0,
            escrowAmount,
            false,
            0
          ),
          TRANSACTION_TIMEOUT
        );
        await withTimeout(listTx.wait(), TRANSACTION_TIMEOUT);
        console.log('batchMintNfts: Listed NFT, tokenId:', tokenId);
      }
      imageURIs.push(imageUri);
    }
    return { tokenIds, imageURIs };
  } catch (err) {
    console.error('batchMintNfts error:', err.message, err.stack);
    throw err;
  }
}

export async function batchListNfts(listings, { escrowListings, doArt }) {
  const nftContracts = (listings || []).map(() => doArt.address);
  const tokenIds = (listings || []).map((l) => l.tokenId);
  const buyers = (listings || []).map(() => ethers.constants.AddressZero);
  const prices = (listings || []).map((l) =>
    ethers.utils.parseEther(l.price.toString())
  );
  const minBids = (listings || []).map((l) =>
    ethers.utils.parseEther(l.minBid.toString())
  );
  const escrowAmounts = (listings || []).map(() =>
    ethers.utils.parseEther('0.01')
  );
  const isAuctions = (listings || []).map((l) => l.isAuction);
  const auctionDurations = (listings || []).map((l) =>
    l.isAuction ? l.auctionDuration * 3600 : 0
  );
  for (const tokenId of tokenIds) {
    const approveTx = await doArt.approve(escrowListings.address, tokenId);
    await approveTx.wait();
  }
  const listTx = await escrowListings.batchList(
    nftContracts,
    tokenIds,
    buyers,
    prices,
    minBids,
    escrowAmounts,
    isAuctions,
    auctionDurations
  );
  await listTx.wait();
  return tokenIds;
}

export async function placeBid(
  { contractAddress, tokenId, amount },
  { escrowAuctions }
) {
  const bidAmount = ethers.utils.parseEther(amount.toString());
  const tx = await escrowAuctions.batchPlaceBid(
    contractAddress,
    [tokenId],
    [bidAmount],
    { value: bidAmount }
  );
  await tx.wait();
  return { contractAddress, tokenId, amount: bidAmount };
}

export async function batchPlaceBids(bids, { escrowAuctions }) {
  const contractAddress = bids[0].contractAddress;
  const tokenIds = (bids || []).map((b) => b.tokenId);
  const amounts = (bids || []).map((b) =>
    ethers.utils.parseEther(b.amount.toString())
  );
  const totalValue = amounts.reduce(
    (sum, amt) => sum.add(amt),
    ethers.BigNumber.from(0)
  );
  const tx = await escrowAuctions.batchPlaceBid(
    contractAddress,
    tokenIds,
    amounts,
    { value: totalValue }
  );
  await tx.wait();
  return bids;
}

export async function placeAuctionBid(
  { contractAddress, tokenId, amount },
  { escrowAuctions }
) {
  const bidAmount = ethers.utils.parseEther(amount.toString());
  const tx = await escrowAuctions.batchPlaceAuctionBid(
    contractAddress,
    [tokenId],
    [bidAmount],
    { value: bidAmount }
  );
  await tx.wait();
  return { contractAddress, tokenId, amount: bidAmount };
}

export async function batchPlaceAuctionBids(bids, { escrowAuctions }) {
  const contractAddress = bids[0].contractAddress;
  const tokenIds = (bids || []).map((b) => b.tokenId);
  const amounts = (bids || []).map((b) =>
    ethers.utils.parseEther(b.amount.toString())
  );
  const totalValue = amounts.reduce(
    (sum, amt) => sum.add(amt),
    ethers.BigNumber.from(0)
  );
  const tx = await escrowAuctions.batchPlaceAuctionBid(
    contractAddress,
    tokenIds,
    amounts,
    { value: totalValue }
  );
  await tx.wait();
  return bids;
}
export async function editListing(
  { contractAddress, tokenId, purchasePrice },
  { escrowListings }
) {
  const price = ethers.utils.parseEther(purchasePrice.toString());

  const tx = await escrowListings.updateListing(
    contractAddress,
    tokenId,
    price
  );
  await tx.wait();

  return { contractAddress, tokenId, purchasePrice };
}

export async function createLazyMintVoucher(
  { title, description, image, price, royaltyBps = 500 },
  { doArt, escrowLazyMinting, signer }
) {
  const imageUri = await uploadToPinata(image);
  const metadata = { name: title, description, image: imageUri };
  const metadataUri = await uploadToPinata(metadata, true);

  const tokenId = (await doArt.totalSupply()).add(1).toString();
  const priceWei = ethers.utils.parseEther(price.toString());

  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'uint256', 'string', 'uint96'],
    [doArt.address, tokenId, priceWei, metadataUri, royaltyBps]
  );
  const signature = await signer.signMessage(
    ethers.utils.arrayify(messageHash)
  );

  return {
    tokenId,
    creator: await signer.getAddress(),
    price: priceWei,
    uri: metadataUri,
    royaltyBps,
    signature
  };
}

export async function redeemLazyMint(voucher, { escrowLazyMinting }) {
  const tx = await escrowLazyMinting.redeemLazyMint(
    escrowLazyMinting.address,
    voucher,
    { value: voucher.price }
  );
  await tx.wait();
  return voucher.tokenId;
}

export async function cancelListing(
  { contractAddress, tokenId },
  { escrowListings }
) {
  const tx = await escrowListings.cancelSale(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function pauseContract(contract, contractName) {
  const tx = await contract.pause();
  await tx.wait();
  toast.success(`${contractName} paused`);
}

export async function unpauseContract(contract, contractName) {
  const tx = await contract.unpause();
  await tx.wait();
  toast.success(`${contractName} unpaused`);
}

export async function acceptBid(
  { contractAddress, tokenId, bidIndex },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.acceptBid(contractAddress, tokenId, bidIndex);
  await tx.wait();
  return { contractAddress, tokenId, bidIndex };
}

export async function endAuction(
  { contractAddress, tokenId },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.endAuction(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function burnNft(tokenId, { doArt }) {
  const tx = await doArt.burn(tokenId);
  await tx.wait();
  return tokenId;
}

export async function setArtistMetadata(
  { name, bio, portfolioUrl },
  { doArt }
) {
  const tx = await doArt.setArtistMetadata(name, bio, portfolioUrl);
  await tx.wait();
  return { name, bio, portfolioUrl };
}

export async function getArtistMetadata(artist, { doArt }) {
  return await doArt.getArtistMetadata(artist);
}

export async function setTokenRoyalty(
  { tokenId, recipient, royaltyBps },
  { doArt }
) {
  const tx = await doArt.setTokenRoyalty(tokenId, recipient, royaltyBps);
  await tx.wait();
  return { tokenId, recipient, royaltyBps };
}

export async function getTokenDetails(tokenId, { doArt }) {
  return await doArt.getTokenDetails(tokenId);
}

export async function cancelAuction(
  { contractAddress, tokenId },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.cancelAuction(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function depositEarnest(
  { contractAddress, tokenId, amount },
  { escrowListings }
) {
  const tx = await escrowListings.depositEarnest(contractAddress, tokenId, {
    value: amount
  });
  await tx.wait();
  return { contractAddress, tokenId, amount };
}

export async function approveArtwork(
  { contractAddress, tokenId, approved },
  { escrowListings }
) {
  const tx = await escrowListings.approveArtwork(
    contractAddress,
    tokenId,
    approved
  );
  await tx.wait();
  return { contractAddress, tokenId, approved };
}

export async function updateListing(
  { contractAddress, tokenId, price },
  { escrowListings }
) {
  const priceWei = ethers.utils.parseEther(price.toString());
  const tx = await escrowListings.updateListing(
    contractAddress,
    tokenId,
    priceWei
  );
  await tx.wait();
  return { contractAddress, tokenId, price };
}

export async function cancelSale(
  { contractAddress, tokenId },
  { escrowListings }
) {
  const tx = await escrowListings.cancelSale(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function list(data, { escrowListings }) {
  const tx = await escrowListings.list(
    data.nftContract,
    data.tokenId,
    data.buyer,
    data.price,
    data.minBid,
    data.escrowAmount,
    data.isAuction,
    data.auctionDuration
  );
  await tx.wait();
  return data;
}

export async function batchList(data, { escrowListings }) {
  const tx = await escrowListings.batchList(
    data.nftContracts,
    data.tokenIds,
    data.buyers,
    data.prices,
    data.minBids,
    data.escrowAmounts,
    data.isAuctions,
    data.auctionDurations
  );
  await tx.wait();
  return data;
}

// export async function getNfts({ escrowStorage }) {
//   if (!escrowStorage) throw new Error('Contract not initialized');
//   try {
//     console.log('getNfts: Fetching listings from EscrowStorage');
//     const listings = await escrowStorage.getAllListings();
//     const auctions = await escrowStorage.getAllAuctions();
//     const nfts = listings.map((listing) => {
//       const tokenId = listing.tokenId.toString();
//       const contractAddress = listing.nftContract;
//       const auction = auctions.find(
//         (a) =>
//           a.contractAddress === contractAddress &&
//           a.tokenId.toString() === tokenId
//       );
//       console.log('getNfts: Processed listing', {
//         tokenId,
//         isListed: listing.isListed
//       });
//       return {
//         contractAddress,
//         tokenId,
//         listing: {
//           isListed: listing.isListed,
//           seller: listing.seller,
//           buyer: listing.buyer,
//           price: ethers.utils.formatEther(listing.price),
//           minBid: ethers.utils.formatEther(listing.minBid),
//           escrowAmount: ethers.utils.formatEther(listing.escrowAmount),
//           viewingPeriodEnd: listing.viewingPeriodEnd.toNumber(),
//           isAuction: listing.isAuction,
//           uri: listing.uri
//         },
//         auction: auction
//           ? {
//               isActive: auction.isActive,
//               endTime: auction.endTime.toNumber(),
//               minBid: ethers.utils.formatEther(auction.minBid),
//               minIncrement: ethers.utils.formatEther(auction.minIncrement),
//               highestBidder: auction.highestBidder,
//               highestBid: ethers.utils.formatEther(auction.highestBid)
//             }
//           : null,
//         metadata: {
//           name: listing.title || `Token #${tokenId}`,
//           description: listing.description || '',
//           image: listing.uri
//             ? listing.uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
//             : ''
//         }
//       };
//     });
//     console.log('getNfts: Returning NFTs', nfts);
//     return nfts;
//   } catch (err) {
//     console.error('getNfts error:', err.message, err.stack);
//     throw err;
//   }
// }

export async function getNfts({ escrowStorage }) {
  if (!escrowStorage) throw new Error('Contract not initialized');
  try {
    console.log('getNfts: Fetching listings from EscrowStorage');
    const listings = await escrowStorage.getAllListings();
    const auctions = await escrowStorage.getAllAuctions();
    const nfts = listings.map((listing) => {
      const tokenId = listing.tokenId.toString();
      const contractAddress = listing.nftContract;
      const auction = auctions.find(
        (a) =>
          a.contractAddress === contractAddress &&
          a.tokenId.toString() === tokenId
      );
      console.log('getNfts: Processed listing', {
        tokenId,
        isListed: listing.isListed
      });
      return {
        contractAddress,
        tokenId,
        listing: {
          isListed: listing.isListed,
          seller: listing.seller,
          buyer: listing.buyer,
          price: listing.price, // Keep as BigNumber
          minBid: listing.minBid,
          escrowAmount: listing.escrowAmount,
          viewingPeriodEnd: listing.viewingPeriodEnd.toNumber(),
          isAuction: listing.isAuction,
          uri: listing.uri
        },
        auction: auction
          ? {
              isActive: auction.isActive,
              endTime: auction.endTime.toNumber(),
              minBid: auction.minBid,
              minIncrement: auction.minIncrement,
              highestBidder: auction.highestBidder,
              highestBid: auction.highestBid
            }
          : null,
        metadata: {
          name: listing.title || `Token #${tokenId}`,
          description: listing.description || '',
          image: listing.uri
            ? listing.uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : ''
        }
      };
    });
    console.log('getNfts: Returning NFTs', nfts);
    return nfts;
  } catch (err) {
    console.error('getNfts error:', err.message, err.stack);
    throw err;
  }
}
