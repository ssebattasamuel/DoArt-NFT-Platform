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

    const totalSupply = await doArt.totalSupply();
    console.log('Total NFTs minted:', totalSupply.toString());

    const listings = await escrowStorage.getListings();
    console.log('Listings fetched:', listings);

    const auctions = await escrowStorage.getAuctions();
    console.log('Auctions fetched:', auctions);

    const nfts = await Promise.all(
      listings.map(async (listing) => {
        const tokenId = listing.tokenId.toString();
        const contractAddress = listing.nftContract;
        const isListed = listing.isListed;
        const price = listing.price;
        const escrowAmount = listing.escrowAmount;
        let uri, metadata;
        try {
          uri = await doArt.tokenURI(tokenId);
          console.log(`Token ${tokenId} URI:`, uri);
          metadata = await (await fetch(uri)).json();
          console.log(`Token ${tokenId} Metadata:`, metadata);
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

    console.log('Final NFTs to display:', nfts);
    return nfts;
  };

  const {
    isLoading,
    data: artNfts,
    error
  } = useQuery({
    queryKey: ['artnfts'],
    queryFn: fetchNfts
  });

  return { isLoading, error, artNfts };
}
