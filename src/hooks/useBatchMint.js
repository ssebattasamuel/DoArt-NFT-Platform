import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchMintNfts } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useBatchMint() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: batchMint, isLoading: isMinting } = useMutation({
    mutationFn: (nfts) => batchMintNfts(nfts, contracts),
    onSuccess: () => {
      toast.success('NFTs minted successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to mint NFTs: ${err.message}`)
  });

  return { batchMint, isMinting };
}
