import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEditNft } from '../services/apiArtNfts';
import toast from 'react-hot-toast';

export function useEditNft() {
  const queryClient = useQueryClient();
  const { mutate: editNft, isLoading: isEditing } = useMutation({
    mutationFn: ({ newNftData, id }) => createEditNft(newNftData, id),
    onSuccess: () => {
      toast.success('Nft successfully Edited');
      queryClient.invalidateQueries({ queryKey: ['artnfts'] });
    },
    onError: (err) => toast.error(err.message),
  });
  return { isEditing, editNft };
}
