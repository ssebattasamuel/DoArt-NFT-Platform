// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { batchListNfts } from '../services/apiArtNfts';
// import { toast } from 'react-hot-toast';
// import { useWeb3 } from './useWeb3';

// export function useListNfts() {
//   const queryClient = useQueryClient();
//   const { contracts } = useWeb3();

//   const { mutate: listNfts, isLoading: isListing } = useMutation({
//     mutationFn: (listings) => batchListNfts(listings, contracts),
//     onSuccess: () => {
//       toast.success('NFTs listed successfully');
//       queryClient.invalidateQueries(['artNfts']);
//     },
//     onError: (err) => toast.error(`Failed to list NFTs: ${err.message}`)
//   });

//   return { listNfts, isListing };
// }
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchListNfts } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useListNfts() {
  const queryClient = useQueryClient();
  const { contracts } = useWeb3();

  const { mutate: listNfts, isLoading: isListing } = useMutation({
    mutationFn: (listings) => batchListNfts(listings, contracts),
    onSuccess: () => {
      toast.success('NFTs listed successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to list NFTs: ${err.message}`)
  });

  return { listNfts, isListing };
}
