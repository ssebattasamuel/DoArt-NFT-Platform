import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setTokenRoyalty } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useSetTokenRoyalty() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: setRoyalty, isLoading: isSetting } = useMutation({
    mutationFn: ({ tokenId, recipient, royaltyBps }) =>
      setTokenRoyalty({ tokenId, recipient, royaltyBps }, contracts),
    onSuccess: () => {
      toast.success('Token royalty set successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to set token royalty: ${err.message}`)
  });

  return { setRoyalty, isSetting };
}
