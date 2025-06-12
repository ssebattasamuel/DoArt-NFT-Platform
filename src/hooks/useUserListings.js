import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { toast } from 'react-hot-toast';

export function useUserListings() {
  const { contracts, account, provider } = useWeb3();

  const fetchUserData = async () => {
    if (!account || !provider || !contracts.doArt || !contracts.escrowStorage) {
      return { ownedNfts: [], userListings: [], userBids: [] };
    }

    const doArt = contracts.doArt;
    const escrowStorage = contracts.escrowStorage;

    // Fetch owned NFTs
    const balance = await doArt.balanceOf(account);
    const ownedNfts = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await doArt.tokenOfOwnerByIndex(account, i);
      const uri = await doArt.tokenURI(tokenId);
      let metadata;
      try {
        metadata = await (
          await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'))
        ).json();
      } catch {
        metadata = { name: `Token #${tokenId}`, image: '', description: '' };
      }
      ownedNfts.push({
        contractAddress: doArt.address,
        tokenId: tokenId.toString(),
        metadata,
        listing: {
          isListed: false,
          price: ethers.BigNumber.from(0),
          escrowAmount: ethers.BigNumber.from(0),
          uri
        },
        auction: null,
        bids: []
      });
    }

    // Fetch user listings and bids
    const listings = await escrowStorage.getListings();
    const auctions = await escrowStorage.getAuctions();
    const userListings = [];
    const userBids = [];

    for (const listing of listings) {
      const tokenId = listing.tokenId.toString();
      const contractAddress = listing.nftContract;
      let uri, metadata;
      try {
        uri = await doArt.tokenURI(tokenId);
        metadata = await (
          await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'))
        ).json();
      } catch {
        metadata = { name: `Token #${tokenId}`, image: '', description: '' };
      }

      const bids = await escrowStorage.getBids(contractAddress, tokenId);
      const auction = auctions.find(
        (a) =>
          a.contractAddress === contractAddress &&
          a.tokenId.toString() === tokenId
      );

      const nftData = {
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

      if (listing.seller.toLowerCase() === account.toLowerCase()) {
        userListings.push(nftData);
      }
      if (
        bids.some((bid) => bid.bidder.toLowerCase() === account.toLowerCase())
      ) {
        userBids.push(nftData);
      }
    }

    return { ownedNfts, userListings, userBids };
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['userListings', account],
    queryFn: fetchUserData,
    enabled: !!account && !!provider && !!contracts.doArt,
    onError: (err) => toast.error(`Failed to fetch user data: ${err.message}`)
  });

  return {
    ownedNfts: data?.ownedNfts || [],
    userListings: data?.userListings || [],
    userBids: data?.userBids || [],
    isLoading,
    error
  };
}
