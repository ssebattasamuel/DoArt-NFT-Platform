import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteNft as deleteNftApi } from '../../services/apiArtNfts';

export function useDeleteNft() {
  const queryClient = useQueryClient();

  const { isLoading: isDeleting, mutate: deleteNft } = useMutation({
    mutationFn: deleteNftApi,
    onSuccess: () => {
      toast.success('Cabin successfully deleted');

      QueryClient.invalidateQueries({
        queryKey: ['cabins'],
      });
    },
    onError: (err) => toast.error(err.message),
  });
  return { isDeleting, deleteNft };
}
