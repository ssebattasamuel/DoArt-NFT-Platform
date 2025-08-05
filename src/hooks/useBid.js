import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchPlaceBids } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useBid() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3Context();

  const { mutate: placeBid, isLoading: isBidding } = useMutation({
    mutationFn: (bids) => batchPlaceBids(bids, contracts),
    onSuccess: () => {
      toast.success('Bids placed successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to place bids: ${err.message}`)
  });

  return { placeBid, isBidding };
}
