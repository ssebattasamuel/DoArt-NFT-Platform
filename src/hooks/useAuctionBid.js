import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchPlaceAuctionBids } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useAuctionBid() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

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
