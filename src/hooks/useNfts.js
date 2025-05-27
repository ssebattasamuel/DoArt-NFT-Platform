// src/hooks/useNfts.js
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import DoArtABI from '../abis/DoArt.json';
import config from '../config';

export function useNfts() {
  const chainId = import.meta.env.VITE_CHAIN_ID;
  const provider = new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:8545'
  );

  const fetchNfts = async () => {
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

    const nfts = await Promise.all(
      listings.map(async (listing) => {
        const tokenId = listing.tokenId.toString();
        const contractAddress = listing.contractAddress;
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
          metadata,
        };
      })
    );

    return nfts;
  };

  const {
    isLoading,
    data: artNfts,
    error,
  } = useQuery({
    queryKey: ['artnfts'],
    queryFn: fetchNfts,
  });

  return { isLoading, error, artNfts };
}
