import { useMutation, useQueryClient } from '@tanstack/react-query';
import { redeemLazyMint } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useRedeemLazyMint() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3Context();

  const { mutate: redeem, isLoading: isRedeeming } = useMutation({
    mutationFn: (voucher) => redeemLazyMint(voucher, contracts),
    onSuccess: () => {
      toast.success('Lazy mint redeemed successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to redeem lazy mint: ${err.message}`)
  });

  return { redeem, isRedeeming };
}
