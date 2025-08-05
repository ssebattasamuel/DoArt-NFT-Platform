import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchPlaceAuctionBids } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useAuctionBid() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3Context();

  const { mutate: placeAuctionBid, isLoading: isAuctionBidding } = useMutation({
    mutationFn: (bids) => batchPlaceAuctionBids(bids, contracts),
    onSuccess: () => {
      toast.success('Auction bids placed successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => {
      toast.error(`Failed to place auction bids: ${err.message}`);
    }
  });

  return { placeAuctionBid, isAuctionBidding };
}
