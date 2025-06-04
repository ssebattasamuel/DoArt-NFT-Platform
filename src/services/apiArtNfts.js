import { ethers } from 'ethers';
import axios from 'axios';
import DoArtABI from '../abis/DoArt.json';
import EscrowListingsABI from '../abis/EscrowListings.json';
import EscrowAuctionsABI from '../abis/EscrowAuctions.json';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import config from '../config';

const chainId = import.meta.env.VITE_CHAIN_ID;
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

async function uploadToPinata(file, isJson = false) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  if (isJson) {
    formData.append(
      'file',
      new Blob([JSON.stringify(file)], { type: 'application/json' }),
      'metadata.json'
    );
  } else {
    formData.append('file', file);
  }

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY
      }
    });
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    throw new Error(`Pinata upload failed: ${error.message}`);
  }
}

export async function getArtNfts(signer) {
  const escrowStorage = new ethers.Contract(
    config[chainId].escrowStorage.address,
    EscrowStorageABI.abi,
    signer || provider
  );
  const doArt = new ethers.Contract(
    config[chainId].doArt.address,
    DoArtABI.abi,
    signer || provider
  );

  const listings = await escrowStorage.getListings();
  const auctions = await escrowStorage.getAuctions();

  return Promise.all(
    listings.map(async (listing) => {
      const tokenId = listing.tokenId.toString();
      const contractAddress = listing.nftContract;
      const isListed = listing.isListed;
      const price = listing.price;
      const escrowAmount = listing.escrowAmount;
      let uri, metadata;
      try {
        uri = await doArt.tokenURI(tokenId);
        metadata = await (await fetch(uri)).json();
      } catch (error) {
        console.error(
          `Failed to fetch metadata for token ${tokenId}: ${error.message}`
        );
        metadata = { title: `Token #${tokenId}`, image: '' };
      }

      const auction = auctions.find(
        (a) =>
          a.contractAddress === contractAddress &&
          a.tokenId.toString() === tokenId
      );

      return {
        contractAddress,
        tokenId,
        listing: { isListed, price, escrowAmount, uri },
        auction: auction
          ? { isActive: auction.isActive, highestBid: auction.highestBid }
          : { isActive: false, highestBid: ethers.BigNumber.from(0) },
        metadata
      };
    })
  );
}

export async function createEditNft(nftData, signer) {
  if (!signer) throw new Error('Signer not available');

  const doArt = new ethers.Contract(
    config[chainId].doArt.address,
    DoArtABI.abi,
    signer
  );
  const escrowListings = new ethers.Contract(
    config[chainId].escrowListings.address,
    EscrowListingsABI.abi,
    signer
  );

  try {
    const { title, purchasePrice, description, image } = nftData;
    // Upload image to Pinata
    const imageUri = await uploadToPinata(image);
    const metadata = { name: title, description, image: imageUri };
    // Upload metadata to Pinata
    const metadataUri = await uploadToPinata(metadata, true);

    // Mint the NFT
    const royaltyBps = 500; // 5% royalty
    const mintTx = await doArt.mint(metadataUri, royaltyBps);
    await mintTx.wait();

    // Get the tokenId of the newly minted NFT
    const totalSupply = await doArt.totalSupply();
    const tokenId = totalSupply.toString();

    // Approve EscrowListings to manage the NFT
    const approveTx = await doArt.approve(
      config[chainId].escrowListings.address,
      tokenId
    );
    await approveTx.wait();

    // List the NFT for sale
    const price = ethers.utils.parseEther(purchasePrice.toString());
    const escrowAmount = ethers.utils.parseEther('0.01'); // Example escrow amount
    const listTx = await escrowListings.list(
      config[chainId].doArt.address,
      tokenId,
      ethers.constants.AddressZero, // Open to any buyer
      price,
      0, // No minimum bid (not an auction)
      escrowAmount,
      false, // Not an auction
      0 // No auction duration
    );
    await listTx.wait();

    return { id: tokenId, ...nftData };
  } catch (error) {
    if (error.message.includes('user rejected transaction')) {
      throw new Error('Transaction rejected by user');
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient funds for transaction');
    } else {
      throw new Error(`Failed to create NFT: ${error.message}`);
    }
  }
}

export async function cancelListing({ contractAddress, tokenId }) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const escrowListings = new ethers.Contract(
    config[chainId].escrowListings.address,
    EscrowListingsABI.abi,
    signer
  );

  const tx = await escrowListings.cancelSale(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}
