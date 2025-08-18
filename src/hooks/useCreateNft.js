import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createNft } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

let isMutating = false;
let logCount = 0;
const MAX_LOGS = 5;

export function useCreateNft() {
  const queryClient = useQueryClient();
  const { contracts, account } = useWeb3Context();

  console.log('useCreateNft: Contract state:', {
    doArtAddress: contracts?.doArt?.address,
    escrowListingsAddress: contracts?.escrowListings?.address,
    hasSigner: !!contracts?.doArt?.signer
  });

  const { mutate: createNft, isLoading: isCreating } = useMutation({
    mutationKey: ['createNft', account],
    onMutate: (variables) => {
      if (isMutating) {
        console.log('Mutation blocked - already in progress');
        throw new Error('Mutation already in progress');
      }
      isMutating = true;
      if (logCount < MAX_LOGS) {
        console.log('Mint input:', variables);
        logCount++;
      }
    },
    mutationFn: async ({
      title,
      purchasePrice,
      description,
      image,
      royaltyBps,
      isUsd
    }) => {
      console.log('Starting createNft call');
      const result = await createNft(
        { title, purchasePrice, description, image, royaltyBps, isUsd },
        { doArt: contracts.doArt, escrowListings: contracts.escrowListings }
      );
      console.log('createNft completed:', result);
      await new Promise((resolve) => setTimeout(resolve, 15000));
      return result;
    },
    retry: 0,
    onSuccess: (result) => {
      if (!result?.tokenId) {
        console.error('useCreateNft: Invalid result, missing tokenId');
        return;
      }
      console.log('useCreateNft: Mint Successful, tokenId:', result.tokenId);
      toast.success('NFT created successfully');
      queryClient.invalidateQueries(['artNfts']);
      isMutating = false;
      logCount = 0;
    },
    onError: (err) => {
      console.error('Mint error:', err.message, err.stack);
      toast.error(`Failed to create NFT: ${err.message}`);
      isMutating = false;
      logCount = 0;
    }
  });

  return { isCreating, createNft };
}
