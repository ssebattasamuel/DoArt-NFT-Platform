// import { useQuery } from '@tanstack/react-query';
// import { toast } from 'react-hot-toast';
// import { getNfts } from '../services/apiArtNfts';
// import { useWeb3Context } from '../context/Web3Context.jsx';

// export function useNfts() {
//   const context = useWeb3Context();
//   const {
//     contracts = {},
//     account,
//     isLoading: isWeb3Loading,
//     error: web3Error
//   } = context || {};

//   const {
//     data: artNfts,
//     isLoading: isNftsLoading,
//     error: nftsError
//   } = useQuery({
//     queryKey: ['artNfts', account],
//     queryFn: async () => {
//       console.log('useNfts: Fetching NFTs');
//       const result = await getNfts({
//         escrowStorage: contracts.escrowStorage,
//         doArt: contracts.doArt
//       });
//       console.log('useNfts: Fetched NFTs:', result);
//       return result;
//     },
//     enabled:
//       !!contracts.escrowStorage &&
//       !!contracts.doArt &&
//       !!account &&
//       !isWeb3Loading,
//     onError: (err) => toast.error(`Failed to fetch NFTs: ${err.message}`),
//     retry: 0,
//     refetchOnWindowFocus: false,
//     refetchInterval: false,
//     staleTime: 0,
//     cacheTime: 0 // No caching
//   });

//   return {
//     isLoading: isWeb3Loading || isNftsLoading,
//     error: web3Error || nftsError,
//     artNfts: artNfts || []
//   };
// }

// src/hooks/useNfts.js
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getNfts } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useNfts() {
  const context = useWeb3Context();
  const {
    contracts = {},
    account,
    isLoading: isWeb3Loading,
    error: web3Error
  } = context || {};

  const {
    data: artNfts,
    isLoading: isNftsLoading,
    error: nftsError
  } = useQuery({
    queryKey: ['artNfts', account],
    queryFn: async () => {
      console.log('useNfts: Fetching NFTs');
      const result = await getNfts({
        escrowStorage: contracts.escrowStorage,
        doArt: contracts.doArt
      });
      console.log('useNfts: Fetched NFTs:', result);
      return result;
    },
    enabled:
      !!contracts.escrowStorage &&
      !!contracts.doArt &&
      !!account &&
      !isWeb3Loading,
    onError: (err) => toast.error(`Failed to fetch NFTs: ${err.message}`),
    retry: 0,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 0,
    cacheTime: 0
  });

  return {
    isLoading: isWeb3Loading || isNftsLoading,
    error: web3Error || nftsError,
    artNfts: artNfts || []
  };
}
