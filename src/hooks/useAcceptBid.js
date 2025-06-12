import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptBid } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useAcceptBid() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

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
