import { useQuery } from '@tanstack/react-query';
import { getTokenDetails } from '../services/apiArtNfts';
import { useWeb3Context } from '../context/Web3Context.jsx';

export function useGetTokenDetails(tokenId) {
  const { contracts } = useWeb3Context();

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
