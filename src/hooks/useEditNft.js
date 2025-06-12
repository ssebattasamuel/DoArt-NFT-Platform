import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { editListing } from '../services/apiArtNfts';
import { useWeb3 } from './useWeb3';

export function useEditNft() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: editNft, isLoading: isEditing } = useMutation({
    mutationFn: ({ newNftData: { purchasePrice }, id, contractAddress }) =>
      editListing(
        {
          contractAddress: contractAddress || contracts.doArt.address,
          tokenId: id,
          purchasePrice
        },
        { escrowListings: contracts.escrowListings }
      ),
    onSuccess: () => {
      toast.success('NFT listing updated successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to update NFT: ${err.message}`)
  });

  return { isEditing, editNft };
}
