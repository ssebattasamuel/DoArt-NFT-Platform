import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWeb3Context } from '../context/Web3Context.jsx';
import { toast } from 'react-hot-toast';

export function useUserListings() {
  const { contracts, account, provider } = useWeb3Context();

  const fetchUserData = async () => {
    if (!account || !provider || !contracts.doArt || !contracts.escrowStorage) {
      return { ownedNfts: [], userListings: [], userBids: [] };
    }

    const doArt = contracts.doArt;
    const escrowStorage = contracts.escrowStorage;

    const filter = doArt.filters.Transfer(null, account);
    const events = await doArt.queryFilter(filter, 0, 'latest').catch(() => []);
    const ownedTokenIds = events
      .filter((event) => event.args.to.toLowerCase() === account.toLowerCase())
      .map((event) => event.args.tokenId.toString())
      .filter((tokenId, index, self) => self.indexOf(tokenId) === index); 

    const ownedNfts = await Promise.all(
      ownedTokenIds.map(async (tokenId) => {
        let uri, metadata;
        try {
          uri = await doArt.tokenURI(tokenId);
          metadata = await (
            await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'))
          ).json();
        } catch {
          metadata = { name: `Token #${tokenId}`, image: '', description: '' };
        }
        return {
          contractAddress: doArt.address,
          tokenId,
          metadata,
          listing: {
            isListed: false,
            price: ethers.BigNumber.from(0),
            escrowAmount: ethers.BigNumber.from(0),
            uri
          },
          auction: null,
          bids: []
        };
      })
    );

    const listings = (await escrowStorage.getAllListings()) || [];
    const auctions = (await escrowStorage.getAllAuctions()) || [];
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

      const bids = (await escrowStorage.bids(contractAddress, tokenId)) || [];
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
