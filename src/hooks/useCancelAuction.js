import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelAuction } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useCancelAuction() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: cancel, isLoading: isCanceling } = useMutation({
    mutationFn: ({ contractAddress, tokenId }) =>
      cancelAuction({ contractAddress, tokenId }, contracts),
    onSuccess: () => {
      toast.success('Auction canceled successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to cancel auction: ${err.message}`)
  });

  return { cancel, isCanceling };
}
