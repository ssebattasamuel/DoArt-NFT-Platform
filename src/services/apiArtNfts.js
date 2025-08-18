import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { uploadToPinata } from './pinata';
import { convertUsdToEth } from '../utils/priceConverter';

const TRANSACTION_TIMEOUT = 300000;

async function withTimeout(promise, timeout, action) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${action} timed out`)), timeout)
  );
  return Promise.race([promise, timeoutPromise]);
}

export async function createNft(
  { title, purchasePrice, description, image, royaltyBps = 500, isUsd = false },
  { doArt, escrowListings }
) {
  console.log('createNft: Entering function');
  try {
    console.log('createNft: Inputs received:', {
      title,
      purchasePrice,
      description,
      royaltyBps,
      isUsd,
      imageType: image?.constructor?.name,
      doArtAddress: doArt?.address,
      escrowListingsAddress: escrowListings?.address
    });

    // Validate contracts
    console.log('createNft: Validating contracts');
    if (!doArt?.signer || !escrowListings?.signer) {
      throw new Error('Signer not connected to contracts');
    }
    console.log('createNft: Contracts validated');

    // Validate inputs
    console.log('createNft: Validating inputs');
    if (!title || !title.trim()) {
      throw new Error('Title is required');
    }
    if (!description || !description.trim()) {
      throw new Error('Description is required');
    }
    if (!image || !(image instanceof File)) {
      throw new Error('Valid image file is required');
    }
    if (!purchasePrice || Number(purchasePrice) <= 0) {
      throw new Error('Valid purchase price is required');
    }
    console.log('createNft: Inputs validated');

    // Upload image to Pinata
    console.log('createNft: Uploading image to Pinata');
    let imageUri;
    try {
      imageUri = await withTimeout(
        uploadToPinata(image),
        60000,
        'Pinata image upload'
      );
      console.log('createNft: Image pinned, URI:', imageUri);
    } catch (err) {
      console.error(
        'createNft: Pinata image upload failed:',
        err.message,
        err.stack
      );
      throw new Error(`Image upload failed: ${err.message}`);
    }

    // Upload metadata to Pinata
    console.log('createNft: Uploading metadata to Pinata');
    let metadataUri;
    try {
      const metadata = {
        name: title,
        description,
        image: imageUri,
        originalPrice: purchasePrice,
        originalCurrency: isUsd ? 'USD' : 'ETH'
      };
      metadataUri = await withTimeout(
        uploadToPinata(metadata, true),
        60000,
        'Pinata metadata upload'
      );
      console.log('createNft: Metadata pinned, URI:', metadataUri);
    } catch (err) {
      console.error(
        'createNft: Pinata metadata upload failed:',
        err.message,
        err.stack
      );
      throw new Error(`Metadata upload failed: ${err.message}`);
    }

    // Mint NFT
    console.log('createNft: Minting NFT with URI', metadataUri);
    let tokenId;
    try {
      const mintTx = await withTimeout(
        doArt.mint(metadataUri, royaltyBps, { gasLimit: 300000 }),
        TRANSACTION_TIMEOUT,
        'Mint transaction'
      );
      console.log('createNft: Mint tx sent:', mintTx.hash);
      const mintReceipt = await withTimeout(
        mintTx.wait(),
        TRANSACTION_TIMEOUT,
        'Mint confirmation'
      );
      tokenId = mintReceipt.events
        ?.find((e) => e.event === 'Transfer')
        ?.args?.tokenId?.toString();
      if (!tokenId) {
        throw new Error('Failed to retrieve tokenId from mint receipt');
      }
      console.log('createNft: Minted NFT, tokenId:', tokenId);
    } catch (err) {
      console.error(
        'createNft: Mint transaction failed:',
        err.message,
        err.stack
      );
      throw new Error(`Mint failed: ${err.message}`);
    }

    // Approve EscrowListings
    console.log('createNft: Approving EscrowListings for tokenId:', tokenId);
    try {
      const approveTx = await withTimeout(
        doArt.approve(escrowListings.address, tokenId, { gasLimit: 100000 }),
        TRANSACTION_TIMEOUT,
        'Approve transaction'
      );
      await withTimeout(
        approveTx.wait(),
        TRANSACTION_TIMEOUT,
        'Approve confirmation'
      );
      console.log('createNft: Approval completed');
    } catch (err) {
      console.error(
        'createNft: Approve transaction failed:',
        err.message,
        err.stack
      );
      throw new Error(`Approval failed: ${err.message}`);
    }

    // List NFT
    console.log('createNft: Listing NFT with price:', purchasePrice);
    let priceInWei;
    try {
      if (isUsd) {
        console.log('createNft: Converting USD price:', purchasePrice);
        const { weiAmount } = await convertUsdToEth(purchasePrice);
        priceInWei = weiAmount;
      } else {
        priceInWei = ethers.utils.parseEther(purchasePrice.toString());
      }
      console.log('createNft: Price in Wei:', priceInWei.toString());
      const escrowAmount = ethers.utils.parseEther('0.01');
      const listTx = await withTimeout(
        escrowListings.list(
          doArt.address,
          tokenId,
          ethers.constants.AddressZero,
          priceInWei,
          0,
          escrowAmount,
          false,
          0,
          { gasLimit: 200000 }
        ),
        TRANSACTION_TIMEOUT,
        'List transaction'
      );
      const listReceipt = await withTimeout(
        listTx.wait(),
        TRANSACTION_TIMEOUT,
        'List confirmation'
      );
      console.log(
        'createNft: Listed NFT, tokenId:',
        tokenId,
        'tx:',
        listReceipt.transactionHash
      );
    } catch (err) {
      console.error(
        'createNft: List transaction failed:',
        err.message,
        err.stack
      );
      throw new Error(`Listing failed: ${err.message}`);
    }

    console.log('createNft: Success, returning result');
    return {
      tokenId,
      title,
      purchasePrice,
      description,
      imageUri,
      metadataUri
    };
  } catch (err) {
    console.error('createNft: Error:', err.message, err.stack);
    toast.error(`createNft failed: ${err.message}`, { id: 'create-nft-error' });
    throw err;
  } finally {
    console.log('createNft: Exiting function');
  }
}

export async function batchMintNfts(nfts, { doArt, escrowListings }) {
  try {
    if (!doArt?.signer || !escrowListings?.signer) {
      throw new Error('Signer not connected to contracts');
    }
    console.log('batchMintNfts: Batch mint input:', nfts);
    const tokenIds = [];
    const imageURIs = [];
    for (const [index, nft] of nfts.entries()) {
      const {
        title,
        description,
        image,
        royaltyBps = 500,
        purchasePrice,
        isUsd = false
      } = nft;
      console.log(`batchMintNfts: Starting mint for NFT ${index + 1}`, {
        title,
        purchasePrice,
        description,
        royaltyBps,
        isUsd
      });
      if (!purchasePrice || Number(purchasePrice) <= 0) {
        throw new Error(
          `Valid purchase price is required for NFT ${index + 1}`
        );
      }
      const imageUri = await withTimeout(
        uploadToPinata(image),
        TRANSACTION_TIMEOUT,
        `Pinata image upload for NFT ${index + 1}`
      );
      console.log(
        `batchMintNfts: Image pinned for NFT ${index + 1}, URI:`,
        imageUri
      );
      const metadata = {
        name: title,
        description,
        image: imageUri,
        originalPrice: purchasePrice,
        originalCurrency: isUsd ? 'USD' : 'ETH'
      };
      const metadataUri = await withTimeout(
        uploadToPinata(metadata, true),
        TRANSACTION_TIMEOUT,
        `Pinata metadata upload for NFT ${index + 1}`
      );
      console.log(
        `batchMintNfts: Metadata pinned for NFT ${index + 1}, URI:`,
        metadataUri
      );

      console.log(
        `batchMintNfts: Minting NFT ${index + 1} with URI`,
        metadataUri
      );
      const mintTx = await withTimeout(
        doArt.mint(metadataUri, royaltyBps, { gasLimit: 300000 }),
        TRANSACTION_TIMEOUT,
        `Mint transaction for NFT ${index + 1}`
      );
      const receipt = await withTimeout(
        mintTx.wait(),
        TRANSACTION_TIMEOUT,
        `Mint confirmation for NFT ${index + 1}`
      );
      const tokenId = receipt.events
        ?.find((e) => e.event === 'Transfer')
        ?.args?.tokenId.toString();
      tokenIds.push(tokenId);
      console.log(`batchMintNfts: Minted NFT ${index + 1}, tokenId:`, tokenId);

      console.log(
        `batchMintNfts: Approving EscrowListings for tokenId: ${tokenId}`
      );
      const approveTx = await withTimeout(
        doArt.approve(escrowListings.address, tokenId, { gasLimit: 100000 }),
        TRANSACTION_TIMEOUT,
        `Approve transaction for NFT ${index + 1}`
      );
      await withTimeout(
        approveTx.wait(),
        TRANSACTION_TIMEOUT,
        `Approve confirmation for NFT ${index + 1}`
      );

      if (purchasePrice) {
        let priceInWei;
        if (isUsd) {
          console.log(
            `batchMintNfts: Converting USD price for NFT ${index + 1}:`,
            purchasePrice
          );
          const { weiAmount } = await convertUsdToEth(purchasePrice);
          priceInWei = weiAmount;
        } else {
          priceInWei = ethers.utils.parseEther(purchasePrice.toString());
        }
        const escrowAmount = ethers.utils.parseEther('0.01');
        console.log(
          `batchMintNfts: Listing NFT ${index + 1} with price:`,
          priceInWei.toString()
        );
        const listTx = await withTimeout(
          escrowListings.list(
            doArt.address,
            tokenId,
            ethers.constants.AddressZero,
            priceInWei,
            0,
            escrowAmount,
            false,
            0,
            { gasLimit: 200000 }
          ),
          TRANSACTION_TIMEOUT,
          `List transaction for NFT ${index + 1}`
        );
        await withTimeout(
          listTx.wait(),
          TRANSACTION_TIMEOUT,
          `List confirmation for NFT ${index + 1}`
        );
        console.log(
          `batchMintNfts: Listed NFT ${index + 1}, tokenId:`,
          tokenId
        );
      }
      imageURIs.push(imageUri);
    }
    console.log('batchMintNfts: Success, returning result');
    return { tokenIds, imageURIs };
  } catch (err) {
    console.error('batchMintNfts error:', err.message, err.stack);
    toast.error(`batchMintNfts failed: ${err.message}`, {
      id: 'batch-mint-nfts-error'
    });
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
    const approveTx = await doArt.approve(escrowListings.address, tokenId, {
      gasLimit: 100000
    });
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
    auctionDurations,
    { gasLimit: 200000 }
  );
  await listTx.wait();
  console.log('batchListNfts: Success, listed tokenIds:', tokenIds);
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
  console.log('placeBid: Success, bid placed for tokenId:', tokenId);
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
  console.log('batchPlaceBids: Success, bids placed for tokenIds:', tokenIds);
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
  console.log('placeAuctionBid: Success, bid placed for tokenId:', tokenId);
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
  console.log(
    'batchPlaceAuctionBids: Success, bids placed for tokenIds:',
    tokenIds
  );
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
    price,
    { gasLimit: 100000 }
  );
  await tx.wait();
  console.log('editListing: Success, updated listing for tokenId:', tokenId);
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

  console.log(
    'createLazyMintVoucher: Success, created voucher for tokenId:',
    tokenId
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
  console.log('redeemLazyMint: Success, redeemed tokenId:', voucher.tokenId);
  return voucher.tokenId;
}

export async function cancelListing(
  { contractAddress, tokenId },
  { escrowListings }
) {
  const tx = await escrowListings.cancelSale(contractAddress, tokenId, {
    gasLimit: 100000
  });
  await tx.wait();
  console.log(
    'cancelListing: Success, cancelled listing for tokenId:',
    tokenId
  );
  return { contractAddress, tokenId };
}

export async function pauseContract(contract, contractName) {
  const tx = await contract.pause();
  await tx.wait();
  toast.success(`${contractName} paused`);
  console.log('pauseContract: Success, paused:', contractName);
}

export async function unpauseContract(contract, contractName) {
  const tx = await contract.unpause();
  await tx.wait();
  toast.success(`${contractName} unpaused`);
  console.log('unpauseContract: Success, unpaused:', contractName);
}

export async function acceptBid(
  { contractAddress, tokenId, bidIndex },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.acceptBid(
    contractAddress,
    tokenId,
    bidIndex,
    { gasLimit: 100000 }
  );
  await tx.wait();
  console.log('acceptBid: Success, accepted bid for tokenId:', tokenId);
  return { contractAddress, tokenId, bidIndex };
}

export async function endAuction(
  { contractAddress, tokenId },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.endAuction(contractAddress, tokenId, {
    gasLimit: 100000
  });
  await tx.wait();
  console.log('endAuction: Success, ended auction for tokenId:', tokenId);
  return { contractAddress, tokenId };
}

export async function burnNft(tokenId, { doArt }) {
  const tx = await doArt.burn(tokenId, { gasLimit: 100000 });
  await tx.wait();
  console.log('burnNft: Success, burned tokenId:', tokenId);
  return tokenId;
}

export async function setArtistMetadata(
  { name, bio, portfolioUrl },
  { doArt }
) {
  const tx = await doArt.setArtistMetadata(name, bio, portfolioUrl, {
    gasLimit: 100000
  });
  await tx.wait();
  console.log('setArtistMetadata: Success, set metadata for artist');
  return { name, bio, portfolioUrl };
}

export async function getArtistMetadata(artist, { doArt }) {
  const metadata = await doArt.getArtistMetadata(artist);
  console.log(
    'getArtistMetadata: Success, fetched metadata for artist:',
    artist
  );
  return metadata;
}

export async function setTokenRoyalty(
  { tokenId, recipient, royaltyBps },
  { doArt }
) {
  const tx = await doArt.setTokenRoyalty(tokenId, recipient, royaltyBps, {
    gasLimit: 100000
  });
  await tx.wait();
  console.log('setTokenRoyalty: Success, set royalty for tokenId:', tokenId);
  return { tokenId, recipient, royaltyBps };
}

export async function getTokenDetails(tokenId, { doArt }) {
  const details = await doArt.getTokenDetails(tokenId);
  console.log(
    'getTokenDetails: Success, fetched details for tokenId:',
    tokenId
  );
  return details;
}

export async function cancelAuction(
  { contractAddress, tokenId },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.cancelAuction(contractAddress, tokenId, {
    gasLimit: 100000
  });
  await tx.wait();
  console.log(
    'cancelAuction: Success, cancelled auction for tokenId:',
    tokenId
  );
  return { contractAddress, tokenId };
}

export async function depositEarnest(
  { contractAddress, tokenId, amount },
  { escrowListings }
) {
  const tx = await escrowListings.depositEarnest(contractAddress, tokenId, {
    value: amount,
    gasLimit: 100000
  });
  await tx.wait();
  console.log('depositEarnest: Success, deposited for tokenId:', tokenId);
  return { contractAddress, tokenId, amount };
}

export async function approveArtwork(
  { contractAddress, tokenId, approved },
  { escrowListings }
) {
  const tx = await escrowListings.approveArtwork(
    contractAddress,
    tokenId,
    approved,
    { gasLimit: 100000 }
  );
  await tx.wait();
  console.log('approveArtwork: Success, approved for tokenId:', tokenId);
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
    priceWei,
    { gasLimit: 100000 }
  );
  await tx.wait();
  console.log('updateListing: Success, updated listing for tokenId:', tokenId);
  return { contractAddress, tokenId, price };
}

export async function cancelSale(
  { contractAddress, tokenId },
  { escrowListings }
) {
  const tx = await escrowListings.cancelSale(contractAddress, tokenId, {
    gasLimit: 100000
  });
  await tx.wait();
  console.log('cancelSale: Success, cancelled sale for tokenId:', tokenId);
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
    data.auctionDuration,
    { gasLimit: 200000 }
  );
  await tx.wait();
  console.log('list: Success, listed tokenId:', data.tokenId);
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
    data.auctionDurations,
    { gasLimit: 200000 }
  );
  await tx.wait();
  console.log('batchList: Success, listed tokenIds:', data.tokenIds);
  return data;
}

export async function getNfts({ escrowStorage, doArt }) {
  if (!escrowStorage || !doArt) throw new Error('Contracts not initialized');
  try {
    console.log('getNfts: Fetching listings from EscrowStorage');
    const listings = await escrowStorage.getAllListings();
    const auctions = await escrowStorage.getAllAuctions();
    const nfts = [];
    for (const listing of listings) {
      const tokenId = listing.tokenId.toString();
      const contractAddress = listing.nftContract;
      let uri = '';
      let metadata = { name: `Token #${tokenId}`, description: '', image: '' };
      try {
        uri = await doArt.tokenURI(tokenId);
        const response = await fetch(
          uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
        );
        metadata = await response.json();
        metadata.image = metadata.image.replace(
          'ipfs://',
          'https://ipfs.io/ipfs/'
        );
      } catch (err) {
        console.error('Error fetching metadata for token', tokenId, err);
      }
      const auctionData = auctions.find(
        (a) =>
          a.contractAddress === contractAddress &&
          a.tokenId.toString() === tokenId
      );
      const bidList = await escrowStorage.getBids(contractAddress, tokenId);
      nfts.push({
        contractAddress,
        tokenId,
        listing: {
          isListed: listing.isListed,
          seller: listing.seller,
          buyer: listing.buyer,
          price: listing.price,
          minBid: listing.minBid,
          escrowAmount: listing.escrowAmount,
          viewingPeriodEnd: listing.viewingPeriodEnd.toNumber(),
          isAuction: listing.isAuction
        },
        auction: auctionData
          ? {
              isActive: auctionData.isActive,
              endTime: auctionData.endTime.toNumber(),
              minBid: auctionData.minBid,
              minIncrement: auctionData.minIncrement,
              highestBidder: auctionData.highestBidder,
              highestBid: auctionData.highestBid
            }
          : null,
        bids: bidList.map((bid) => ({
          bidder: bid.bidder,
          amount: bid.amount
        })),
        metadata
      });
    }
    console.log('getNfts: Returning NFTs', nfts);
    return nfts;
  } catch (err) {
    console.error('getNfts error:', err.message, err.stack);
    toast.error(`getNfts failed: ${err.message}`, { id: 'get-nfts-error' });
    throw err;
  }
}
