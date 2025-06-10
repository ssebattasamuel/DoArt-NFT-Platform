import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { toast } from 'react-hot-toast';

export function useNfts() {
  const { contracts, provider } = useWeb3();

  const fetchNfts = async () => {
    if (!provider || !contracts.escrowStorage || !contracts.doArt) {
      throw new Error('Contracts not initialized');
    }

    const listings = await contracts.escrowStorage.getListings();
    const auctions = await contracts.escrowStorage.getAuctions();

    const nfts = await Promise.all(
      listings.map(async (listing) => {
        const tokenId = listing.tokenId.toString();
        const contractAddress = listing.nftContract;
        let uri, metadata;
        try {
          uri = await contracts.doArt.tokenURI(tokenId);
          const response = await fetch(
            uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
          );
          metadata = await response.json();
        } catch {
          metadata = { name: `Token #${tokenId}`, image: '', description: '' };
        }

        const bids = await contracts.escrowStorage.getBids(
          contractAddress,
          tokenId
        );
        const auction = auctions.find(
          (a) =>
            a.contractAddress === contractAddress &&
            a.tokenId.toString() === tokenId
        );

        return {
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
            isAuction: listing.isAuction,
            uri
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
          bids: bids.map((bid) => ({
            bidder: bid.bidder,
            amount: bid.amount
          })),
          metadata
        };
      })
    );

    return nfts;
  };

  const {
    data: artNfts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['artNfts'],
    queryFn: fetchNfts,
    enabled: !!provider && !!contracts.escrowStorage && !!contracts.doArt,
    onError: (err) => toast.error(`Failed to fetch NFTs: ${err.message}`)
  });

  return { isLoading, error, artNfts: artNfts || [] };
}
