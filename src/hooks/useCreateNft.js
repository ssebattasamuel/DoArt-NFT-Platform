// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'react-hot-toast';
// import { createNft } from '../services/apiArtNfts';
// import { useWeb3Context } from '../context/Web3Context.jsx';

// export function useCreateNft() {
//   const queryClient = useQueryClient();
//   const { contracts, account } = useWeb3Context();

//   const { mutate: createNft, isLoading: isCreating } = useMutation({
//     mutationFn: ({ title, purchasePrice, description, image, royaltyBps }) => {
//       if (!account) throw new Error('Wallet not connected');
//       if (!contracts.doArt?.signer || !contracts.escrowListings?.signer) {
//         throw new Error('Signer not connected to contracts');
//       }
//       console.log('Mint input:', {
//         title,
//         purchasePrice,
//         description,
//         image,
//         royaltyBps
//       });
//       return createNft(
//         { title, purchasePrice, description, image, royaltyBps },
//         { doArt: contracts.doArt, escrowListings: contracts.escrowListings }
//       );
//     },
//     retry: 0, // Disable retries
//     onSuccess: () => {
//       console.log('useCreateNft: Mint Successful');
//       toast.success('NFT created successfully');
//       queryClient.invalidateQueries(['artNfts']);
//     },
//     onError: (err) => {
//       console.error('Mint error:', err.message, err.stack);
//       toast.error(`Failed to create NFT: ${err.message}`);
//     }
//   });

//   return { isCreating, createNft };
// }
/*
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createNft } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useCreateNft() {
  const queryClient = useQueryClient();
  const { contracts, account } = useWeb3Context();

  const { mutate: createNft, isLoading: isCreating } = useMutation({
    mutationFn: ({
      title,
      purchasePrice,
      description,
      image,
      royaltyBps,
      isUsd
    }) => {
      if (!account) throw new Error('Wallet not connected');
      if (!contracts.doArt?.signer || !contracts.escrowListings?.signer) {
        throw new Error('Signer not connected to contracts');
      }
      console.log('Mint input:', {
        title,
        purchasePrice,
        description,
        image,
        royaltyBps,
        isUsd
      });
      return createNft(
        { title, purchasePrice, description, image, royaltyBps, isUsd },
        { doArt: contracts.doArt, escrowListings: contracts.escrowListings }
      );
    },
    retry: 0, // Disable retries
    onSuccess: () => {
      console.log('useCreateNft: Mint Successful');
      toast.success('NFT created successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => {
      console.error('Mint error:', err.message, err.stack);
      toast.error(`Failed to create NFT: ${err.message}`);
    }
  });

  return { isCreating, createNft };
}
  */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createNft } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useCreateNft() {
  const queryClient = useQueryClient();
  const { contracts, account } = useWeb3Context();

  const { mutate: createNft, isLoading: isCreating } = useMutation({
    mutationFn: async ({
      title,
      purchasePrice,
      description,
      image,
      royaltyBps,
      isUsd
    }) => {
      if (!account) throw new Error('Wallet not connected');
      if (!contracts.doArt?.signer || !contracts.escrowListings?.signer) {
        throw new Error('Signer not connected to contracts');
      }
      console.log('Mint input:', {
        title,
        purchasePrice,
        description,
        image,
        royaltyBps,
        isUsd
      });
      return await createNft(
        { title, purchasePrice, description, image, royaltyBps, isUsd },
        { doArt: contracts.doArt, escrowListings: contracts.escrowListings }
      );
    },
    retry: 0,
    onSuccess: () => {
      console.log('useCreateNft: Mint Successful');
      toast.success('NFT created successfully');
      queryClient.invalidateQueries(['artNfts']);
      // Force refetch to ensure listing appears
      queryClient.refetchQueries(['artNfts']);
    },
    onError: (err) => {
      console.error('Mint error:', err.message, err.stack);
      toast.error(`Failed to create NFT: ${err.message}`);
    }
  });

  return { isCreating, createNft };
}
