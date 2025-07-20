// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { createLazyMintVoucher, redeemLazyMint } from '../services/apiArtNfts';
// import { toast } from 'react-hot-toast';
// import { useWeb3 } from './useWeb3';

// export function useLazyMint() {
//   const queryClient = useQueryClient();
//   const { contracts, signer } = useWeb3();

//   const { mutate: createLazyMint, isLoading: isCreating } = useMutation({
//     mutationFn: (data) => createLazyMintVoucher(data, { ...contracts, signer }),
//     onSuccess: (voucher) => {
//       toast.success(`Lazy mint voucher created for token #${voucher.tokenId}`);
//       queryClient.invalidateQueries(['artNfts']);
//     },
//     onError: (err) => toast.error(`Failed to create voucher: ${err.message}`)
//   });

//   const { mutate: redeemVoucher, isLoading: isRedeeming } = useMutation({
//     mutationFn: (voucher) => redeemLazyMint(voucher, contracts),
//     onSuccess: () => {
//       toast.success('Voucher redeemed successfully');
//       queryClient.invalidateQueries(['artNfts']);
//     },
//     onError: (err) => toast.error(`Failed to redeem voucher: ${err.message}`)
//   });

//   return { createLazyMint, redeemVoucher, isCreating, isRedeeming };
// }
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLazyMintVoucher, redeemLazyMint } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3 } from './useWeb3';

export function useLazyMint() {
  const queryClient = useQueryClient();
  const { contracts, signer } = useWeb3();

  const { mutate: createLazyMint, isLoading: isCreating } = useMutation({
    mutationFn: (data) => createLazyMintVoucher(data, { ...contracts, signer }),
    onSuccess: (voucher) => {
      toast.success(`Lazy mint voucher created for token #${voucher.tokenId}`);
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to create voucher: ${err.message}`)
  });

  const { mutate: redeemVoucher, isLoading: isRedeeming } = useMutation({
    mutationFn: (voucher) => redeemLazyMint(voucher, contracts),
    onSuccess: () => {
      toast.success('Voucher redeemed successfully');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (err) => toast.error(`Failed to redeem voucher: ${err.message}`)
  });

  return { createLazyMint, redeemVoucher, isCreating, isRedeeming };
}
