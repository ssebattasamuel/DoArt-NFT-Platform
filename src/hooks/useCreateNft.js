import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEditNft } from '../services/apiArtNfts';

export function useCreateNft() {
  const queryClient = useQueryClient();
  const { mutate: createNft, isLoading: isCreating } = useMutation({
    mutationFn: createEditNft,
    onSuccess: () => {
      toast.success('New Nft successfully created');
      queryClient.invalidateQueries({ queryKey: ['artnfts'] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isCreating, createNft };
}
