import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateListing } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useUpdateListing() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: update, isLoading: isUpdating } = useMutation({
    mutationFn: ({ contractAddress, tokenId, price }) =>
      updateListing({ contractAddress, tokenId, price }, contracts),
    onSuccess: () => {
      toast.success('Listing updated successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to update listing: ${err.message}`)
  });

  return { update, isUpdating };
}
