import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptBid } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useAcceptBid() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3Context();

  const { mutate: acceptBid, isLoading: isAccepting } = useMutation({
    mutationFn: ({ contractAddress, tokenId, bidIndex }) =>
      acceptBid({ contractAddress, tokenId, bidIndex }, contracts),
    onSuccess: () => {
      toast.success('Bid accepted successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to accept bid: ${err.message}`)
  });

  return { acceptBid, isAccepting };
}
