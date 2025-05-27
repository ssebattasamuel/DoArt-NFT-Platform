// src/services/apiArtNfts.js
import { ethers } from 'ethers';
import DoArtABI from '../abis/DoArt.json';
import EscrowListingsABI from '../abis/EscrowListings.json';
import EscrowAuctionsABI from '../abis/EscrowAuctions.json';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import config from '../config';

const chainId = import.meta.env.VITE_CHAIN_ID;
const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');

export async function getArtNfts() {
  const escrowStorage = new ethers.Contract(
    config[chainId].escrowStorage.address,
    EscrowStorageABI.abi,
    provider
  );
  const doArt = new ethers.Contract(
    config[chainId].doArt.address,
    DoArtABI.abi,
    provider
  );

  const listings = await escrowStorage.getListings();
  const auctions = await escrowStorage.getAuctions();

  return Promise.all(
    listings.map(async (listing) => {
      const tokenId = listing.tokenId.toString();
      const contractAddress = listing.contractAddress;
      const isListed = listing.isListed;
      const price = listing.price;
      const escrowAmount = listing.escrowAmount;
      const uri = await doArt.tokenURI(tokenId);
      const metadata = await (await fetch(uri)).json();

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
        metadata,
      };
    })
  );
}

export async function createEditNft(nftData, id) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const doArt = new ethers.Contract(
    config[chainId].doArt.address,
    DoArtABI.abi,
    signer
  );

  const { title, purchasePrice, description, image } = nftData;
  // Pseudo-code: Upload image to IPFS (use Pinata/Infura)
  const imageUri = 'ipfs://example';
  const metadata = { title, description, image: imageUri };
  const metadataUri = 'ipfs://metadata'; // Upload metadata to IPFS

  const tx = await doArt.mint(
    signer.getAddress(),
    metadataUri,
    ethers.utils.parseEther(purchasePrice)
  );
  await tx.wait();
  return { id: tx.hash, ...nftData };
}

export async function cancelListing({ contractAddress, tokenId }) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const escrowListings = new ethers.Contract(
    config[chainId].escrowListings.address,
    EscrowListingsABI.abi,
    signer
  );

  const tx = await escrowListings.cancelListing(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}
