import { useMutation, useQuery } from '@tanstack/react-query';
import { pauseContract, unpauseContract } from '../services/apiArtNfts';
import { useWeb3 } from './useWeb3';
import { toast } from 'react-hot-toast';

export function usePause() {
  const { contracts } = useWeb3();

  const { data: isPaused, refetch } = useQuery({
    queryKey: ['contractStatus'],
    queryFn: async () => {
      const statusMap = {};
      for (const [name, contract] of Object.entries(contracts)) {
        try {
          statusMap[name] = await contract.paused();
        } catch {
          statusMap[name] = false;
        }
      }
      return statusMap;
    },
    enabled: !!contracts
  });

  const { mutate: pauseContract, isLoading: isPausing } = useMutation({
    mutationFn: ({ contract, name }) => pauseContract(name, contract),
    onSuccess: () => refetch(),
    onError: (err) => toast.error(`Failed to pause ${name}: ${err.message}`)
  });

  const { mutate: unpauseContract } = useMutation({
    mutationFn: ({ contract, name }) => unpauseContract(name, contract),
    onSuccess: () => refetch(),
    onError: (err) => toast.error(`Failed to unpause ${name}: ${err.message}`)
  });

  return { pauseContract, unpauseContract, isPausing, isPaused };
}
