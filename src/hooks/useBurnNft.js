import { useMutation, useQueryClient } from '@tanstack/react-query';
import { burnNft } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useBurnNft() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: burn, isLoading: isBurning } = useMutation({
    mutationFn: (tokenId) => burnNft(tokenId, contracts),
    onSuccess: () => {
      toast.success('NFT burned successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to burn NFT: ${err.message}`)
  });

  return { burn, isBurning };
}
