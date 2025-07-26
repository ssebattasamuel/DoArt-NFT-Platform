import { useQuery } from '@tanstack/react-query';
import { getTokenDetails } from '../services/apiArtNfts';
import { useWeb3 } from './useWeb3';

export function useGetTokenDetails(tokenId) {
  const { contracts } = useWeb3();

  const { data: details, isLoading } = useQuery({
    queryKey: ['tokenDetails', tokenId],
    queryFn: () => getTokenDetails(tokenId, contracts),
    enabled: !!tokenId && !!contracts.doArt
  });

  return {
    details: details || {
      owner: '',
      uri: '',
      royaltyRecipient: '',
      royaltyBps: 0
    },
    isLoading
  };
}
