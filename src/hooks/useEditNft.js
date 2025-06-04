import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEditNft } from '../services/apiArtNfts';
import toast from 'react-hot-toast';

export function useEditNft() {
  const queryClient = useQueryClient();
  const { mutate: editNft, isLoading: isEditing } = useMutation({
    mutationFn: ({ newNftData, id, signer }) =>
      createEditNft({ ...newNftData, id }, signer),
    onSuccess: () => {
      toast.success('NFT successfully edited');
      queryClient.invalidateQueries({ queryKey: ['artnfts'] });
    },
    onError: (err) => toast.error(err.message)
  });
  return { isEditing, editNft };
}
