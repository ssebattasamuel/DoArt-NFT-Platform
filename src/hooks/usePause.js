import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWeb3Context } from '../context/Web3Context.jsx';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';

export function usePause() {
  const { account, contracts } = useWeb3Context();
  const [isPaused, setIsPaused] = useState(false);
  const [isPauser, setIsPauser] = useState(false);

  const { data: paused, isLoading: isLoadingPaused } = useQuery({
    queryKey: ['paused'],
    queryFn: async () => {
      if (!contracts.doArt) throw new Error('Contract not initialized');
      return await contracts.doArt.paused();
    },
    enabled: !!contracts.doArt,
    onError: (err) => {
      console.error('Paused query error:', err);
      toast.error(`Failed to check pause status: ${err.message}`);
    }
  });

  const { data: hasPauserRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ['pauserRole', account],
    queryFn: async () => {
      if (!account) throw new Error('No wallet connected');
      if (!contracts.doArt) throw new Error('Contract not initialized');
      return await contracts.doArt.hasRole(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes('PAUSER_ROLE')),
        account
      );
    },
    enabled: !!account && !!contracts.doArt,
    onError: (err) => {
      console.error('Pauser role query error:', err);
      toast.error(`Failed to check pauser role: ${err.message}`);
    }
  });

  useEffect(() => {
    if (paused !== undefined) setIsPaused(paused);
    if (hasPauserRole !== undefined) setIsPauser(hasPauserRole);
  }, [paused, hasPauserRole]);

  const pause = async () => {
    if (!account) throw new Error('No wallet connected');
    try {
      const tx = await contracts.doArt.pause();
      await tx.wait();
      setIsPaused(true);
      toast.success('Contract paused');
    } catch (err) {
      console.error('Pause error:', err);
      toast.error(`Failed to pause contract: ${err.message}`);
    }
  };

  const unpause = async () => {
    if (!account) throw new Error('No wallet connected');
    try {
      const tx = await contracts.doArt.unpause();
      await tx.wait();
      setIsPaused(false);
      toast.success('Contract unpaused');
    } catch (err) {
      console.error('Unpause error:', err);
      toast.error(`Failed to unpause contract: ${err.message}`);
    }
  };

  return {
    isPaused,
    isPauser,
    pause,
    unpause,
    isLoading: isLoadingPaused || isLoadingRole
  };
}
