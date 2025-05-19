import { useQuery } from '@tanstack/react-query';
import { getArtNfts } from '../../services/apiArtNfts';

export function useNfts() {
  const {
    isLoading,
    data: artNfts,
    error,
  } = useQuery({
    queryKey: ['artNft'],
    queryFn: getArtNfts,
  });
  return { isLoading, error, artNfts };
}
