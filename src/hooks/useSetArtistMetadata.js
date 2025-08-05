import { useMutation } from '@tanstack/react-query';
import { setArtistMetadata } from '../services/apiArtNfts';
import { toast } from 'react-hot-toast';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useSetArtistMetadata() {
  const { contracts } = useWeb3Context();

  const { mutate: setMetadata, isLoading: isSetting } = useMutation({
    mutationFn: ({ name, bio, portfolioUrl }) =>
      setArtistMetadata({ name, bio, portfolioUrl }, contracts),
    onSuccess: () => toast.success('Artist metadata updated successfully'),
    onError: (err) =>
      toast.error(`Failed to update artist metadata: ${err.message}`)
  });

  return { setMetadata, isSetting };
}
