import { useMutation, useQueryClient } from '@tanstack/react-query';
import { depositEarnest } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useDepositEarnest() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: deposit, isLoading: isDepositing } = useMutation({
    mutationFn: ({ contractAddress, tokenId, amount }) =>
      depositEarnest({ contractAddress, tokenId, amount }, contracts),
    onSuccess: () => {
      toast.success('Earnest deposited successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to deposit earnest: ${err.message}`)
  });

  return { deposit, isDepositing };
}
