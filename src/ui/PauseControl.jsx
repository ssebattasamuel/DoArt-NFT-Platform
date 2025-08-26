import styled from 'styled-components';
import { ethers } from 'ethers';
import { useWeb3Context } from '../context/Web3Context.jsx';
import { usePause } from '../hooks/usePause';
import Button from './Button';
import FormRow from './FormRow';
import { useState, useEffect } from 'react';
import Spinner from './Spinner';

const Container = styled.div`
  display: grid;
  gap: 1rem;
`;

const Message = styled.p`
  color: var(--color-red-700);
  text-align: center;
  font-size: 1.6rem;
  margin: 2rem 0;
`;

function PauseControl() {
  const { contracts, account } = useWeb3Context();
  const { pauseContract, unpauseContract, isPausing, isPaused } = usePause();
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const contractsToControl = [
    { contract: contracts?.escrowListings, name: 'EscrowListings' },
    { contract: contracts?.escrowAuctions, name: 'EscrowAuctions' },
    { contract: contracts?.escrowLazyMinting, name: 'EscrowLazyMinting' },
    { contract: contracts?.doArt, name: 'DoArt' }
  ];

  const checkPermission = async (contract) => {
    if (!contract || !account) return false;
    try {
      const PAUSER_ROLE = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes('PAUSER_ROLE')
      );
      return await contract.hasRole(PAUSER_ROLE, account);
    } catch (err) {
      console.error(`Error checking permission for ${contract.address}:`, err);
      return false;
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true);
      const results = {};
      for (const { contract, name } of contractsToControl) {
        if (contract) {
          results[name] = await checkPermission(contract);
        } else {
          results[name] = false;
        }
      }
      console.log('PauseControl: Permissions fetched:', results);
      setPermissions(results);
      setIsLoading(false);
    };
    if (account && contracts?.doArt) {
      console.log('PauseControl: Fetching permissions with account:', account);
      fetchPermissions();
    } else {
      console.log(
        'PauseControl: No account or doArt contract - skipping fetch'
      );
      setIsLoading(false);
    }
  }, [contracts, account]);

  if (isLoading) return <Spinner />;
  if (!account)
    return <Message>Please connect your wallet to manage contracts.</Message>;
  if (!contracts || Object.keys(contracts).length === 0)
    return (
      <Message>
        Contracts not loaded. Please refresh or check connection.
      </Message>
    );

  const availableControls = contractsToControl.filter(
    ({ contract }) => contract && permissions[name]
  );

  return (
    <Container>
      {availableControls.length > 0 ? (
        availableControls.map(({ contract, name }) => {
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
        })
      ) : (
        <Message>
          No pausable contracts available or you lack permission to manage them.
        </Message>
      )}
    </Container>
  );
}

export default PauseControl;
