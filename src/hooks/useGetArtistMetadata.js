import { useQuery } from '@tanstack/react-query';
import { getArtistMetadata } from '../services/apiArtNfts';
import { useWeb3 } from './useWeb3';

export function useGetArtistMetadata(artist) {
  const { contracts } = useWeb3();

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
