import { useQuery } from '@tanstack/react-query';
import { getArtistMetadata } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useGetArtistMetadata(artist) {
  const { contracts } = useWeb3Context();

  const { data: metadata, isLoading } = useQuery({
    queryKey: ['artistMetadata', artist],
    queryFn: () => getArtistMetadata(artist, contracts),
    enabled: !!artist && !!contracts.doArt
  });

  return {
    metadata: metadata || { name: '', bio: '', portfolioUrl: '' },
    isLoading
  };
}
