import styled from 'styled-components';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { usePause } from '../hooks/usePause';
import Button from './Button';
import FormRow from './FormRow';
import { useState, useEffect } from 'react';

const Container = styled.div`
  display: grid;
  gap: 1rem;
`;

function PauseControl() {
  const { contracts, account } = useWeb3();
  const { pauseContract, unpauseContract, isPausing, isPaused } = usePause();
  const [permissions, setPermissions] = useState({});

  const contractsToControl = [
    { contract: contracts.escrowListings, name: 'EscrowListings' },
    { contract: contracts.escrowAuctions, name: 'EscrowAuctions' },
    { contract: contracts.escrowLazyMinting, name: 'EscrowLazyMinting' },
    { contract: contracts.doArt, name: 'DoArt' }
  ];

  const checkPermission = async (contract) => {
    if (!contract) return false;
    const PAUSER_ROLE = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes('PAUSER_ROLE')
    );
    return await contract.hasRole(PAUSER_ROLE, account);
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      const results = {};
      for (const { contract, name } of contractsToControl) {
        results[name] = await checkPermission(contract);
      }
      setPermissions(results);
    };
    fetchPermissions();
  }, [contracts, account]);

  return (
    <Container>
      {contractsToControl
        .filter(({ name }) => permissions[name])
        .map(({ contract, name }) => {
          const paused = isPaused[name] || false;
          return (
            <FormRow key={name}>
              <span>
                {name}: {paused ? 'Paused' : 'Active'}
              </span>
              <Button
                variation={paused ? 'secondary' : 'danger'}
                disabled={isPausing[name]}
                onClick={() =>
                  paused
                    ? unpauseContract({ contract, name })
                    : pauseContract({ contract, name })
                }
              >
                {isPausing[name]
                  ? 'Processing...'
                  : paused
                    ? 'Unpause'
                    : 'Pause'}
              </Button>
            </FormRow>
          );
        })}
    </Container>
  );
}

export default PauseControl;

/*
import styled from 'styled-components';
import FormRow from './FormRow';

const Container = styled.div`
  display: grid;
  gap: 1rem;
`;

function PauseControl() {
  return <Container></Container>;
}

export default PauseControl;*/
