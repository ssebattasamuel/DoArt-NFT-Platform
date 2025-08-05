// import styled from 'styled-components';
// import { ethers } from 'ethers';
// import { useWeb3Context } from '../context/Web3Context.jsx';
// import { usePause } from '../hooks/usePause';
// import Button from './Button';
// import FormRow from './FormRow';
// import { useState, useEffect } from 'react';

// const Container = styled.div`
//   display: grid;
//   gap: 1rem;
// `;

// function PauseControl() {
//   const { contracts, account } = useWeb3Context();
//   const { pauseContract, unpauseContract, isPausing, isPaused } = usePause();
//   const [permissions, setPermissions] = useState({});

//   const contractsToControl = [
//     { contract: contracts.escrowListings, name: 'EscrowListings' },
//     { contract: contracts.escrowAuctions, name: 'EscrowAuctions' },
//     { contract: contracts.escrowLazyMinting, name: 'EscrowLazyMinting' },
//     { contract: contracts.doArt, name: 'DoArt' }
//   ];

//   const checkPermission = async (contract) => {
//     if (!contract) return false;
//     const PAUSER_ROLE = ethers.utils.keccak256(
//       ethers.utils.toUtf8Bytes('PAUSER_ROLE')
//     );
//     return await contract.hasRole(PAUSER_ROLE, account);
//   };

//   useEffect(() => {
//     const fetchPermissions = async () => {
//       const results = {};
//       for (const { contract, name } of contractsToControl) {
//         results[name] = await checkPermission(contract);
//       }
//       setPermissions(results);
//     };
//     fetchPermissions();
//   }, [contracts, account]);

//   return (
//     <Container>
//       {contractsToControl
//         .filter(({ name }) => permissions[name])
//         .map(({ contract, name }) => {
//           const paused = isPaused[name] || false;
//           return (
//             <FormRow key={name}>
//               <span>
//                 {name}: {paused ? 'Paused' : 'Active'}
//               </span>
//               <Button
//                 variation={paused ? 'secondary' : 'danger'}
//                 disabled={isPausing[name]}
//                 onClick={() =>
//                   paused
//                     ? unpauseContract({ contract, name })
//                     : pauseContract({ contract, name })
//                 }
//               >
//                 {isPausing[name]
//                   ? 'Processing...'
//                   : paused
//                     ? 'Unpause'
//                     : 'Pause'}
//               </Button>
//             </FormRow>
//           );
//         })}
//     </Container>
//   );
// }

// export default PauseControl;

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
  ].filter(({ contract }) => contract); // Filter out undefined contracts

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
        results[name] = await checkPermission(contract);
      }
      setPermissions(results);
      setIsLoading(false);
    };
    if (account && contracts?.doArt) {
      fetchPermissions();
    } else {
      setIsLoading(false);
    }
  }, [contracts, account]);

  if (isLoading) return <Spinner />;
  if (!account) return <p>Please connect your wallet to manage contracts.</p>;

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
      {contractsToControl.length === 0 && (
        <p>No contracts available or you lack permission to manage them.</p>
      )}
    </Container>
  );
}

export default PauseControl;
