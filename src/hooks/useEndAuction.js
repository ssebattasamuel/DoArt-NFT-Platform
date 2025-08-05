import { useMutation, useQueryClient } from '@tanstack/react-query';
import { endAuction } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useEndAuction() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3Context();

  const { mutate: endAuction, isLoading: isEnding } = useMutation({
    mutationFn: ({ contractAddress, tokenId }) =>
      endAuction({ contractAddress, tokenId }, contracts),
    onSuccess: () => {
      toast.success('Auction ended successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to end auction: ${err.message}`)
  });

  return { endAuction, isEnding };
}
