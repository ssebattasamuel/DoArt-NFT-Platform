import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelSale } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useCancelSale() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: cancel, isLoading: isCanceling } = useMutation({
    mutationFn: ({ contractAddress, tokenId }) =>
      cancelSale({ contractAddress, tokenId }, contracts),
    onSuccess: () => {
      toast.success('Sale canceled successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to cancel sale: ${err.message}`)
  });

  return { cancel, isCanceling };
}
