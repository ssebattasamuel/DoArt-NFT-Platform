import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { batchMintNfts } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useBatchMint() {
  const queryClient = useQueryClient();
  const { contracts, account } = useWeb3Context();

  const { mutate: batchMint, isLoading: isMinting } = useMutation({
    mutationFn: async (nfts) => {
      if (!account) throw new Error('Wallet not connected');
      if (!contracts.doArt?.signer || !contracts.escrowListings?.signer) {
        throw new Error('Signer not connected to contracts');
      }
      console.log('Batch mint input:', nfts);
      const result = await batchMintNfts(nfts, {
        doArt: contracts.doArt,
        escrowListings: contracts.escrowListings
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return result;
    },
    retry: 0,
    onSuccess: () => {
      toast.success('NFTs minted successfully');
      queryClient.invalidateQueries(['artNfts']);
      queryClient.refetchQueries(['artNfts']);
    },
    onError: (err) => {
      console.error('Batch mint error:', err.message, err.stack);
      toast.error(`Failed to mint NFTs: ${err.message}`);
    }
  });

  return { isMinting, batchMint };
}
