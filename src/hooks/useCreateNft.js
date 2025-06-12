import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createNft } from '../services/apiArtNfts';
import { useWeb3 } from './useWeb3';

export function useCreateNft() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: createNft, isLoading: isCreating } = useMutation({
    mutationFn: ({ title, purchasePrice, description, image, royaltyBps }) =>
      createNft(
        { title, purchasePrice, description, image, royaltyBps },
        { doArt: contracts.doArt, escrowListings: contracts.escrowListings }
      ),
    onSuccess: () => {
      toast.success('NFT created successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to create NFT: ${err.message}`)
  });

  return { isCreating, createNft };
}
