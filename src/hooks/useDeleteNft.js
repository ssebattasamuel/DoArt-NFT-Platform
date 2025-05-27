// src/hooks/useDeleteNft.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cancelListing } from '../services/apiArtNfts';

export function useDeleteNft() {
  const queryClient = useQueryClient();

  const { isLoading: isDeleting, mutate: deleteNft } = useMutation({
    mutationFn: cancelListing,
    onSuccess: () => {
      toast.success('Listing successfully canceled');
      queryClient.invalidateQueries({ queryKey: ['artnfts'] });
    },
    onError: (err) => toast.error(err.message),
  });
  return { isDeleting, deleteNft };
}
