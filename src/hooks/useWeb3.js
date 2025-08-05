// import { useState, useEffect, useCallback } from 'react';
// import { ethers } from 'ethers';
// import { toast } from 'react-hot-toast';
// import DoArtABI from '../abis/DoArt.json';
// import EscrowStorageABI from '../abis/EscrowStorage.json';
// import EscrowListingsABI from '../abis/EscrowListings.json';
// import EscrowAuctionsABI from '../abis/EscrowAuctions.json';
// import EscrowLazyMintingABI from '../abis/EscrowLazyMinting.json';
// import config from '../config';

// export function useWeb3() {
//   const [provider, setProvider] = useState(null);
//   const [signer, setSigner] = useState(null);
//   const [account, setAccount] = useState(null);
//   const [contracts, setContracts] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const chainId = import.meta.env.VITE_CHAIN_ID;

//   const initWeb3 = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     setAccount(null);
//     setSigner(null);
//     setContracts({});
//     try {
//       if (!window.ethereum) {
//         throw new Error(
//           'MetaMask not installed. Please install MetaMask to use this app.'
//         );
//       }
//       const web3Provider = new ethers.providers.Web3Provider(
//         window.ethereum,
//         'any'
//       );
//       const network = await web3Provider.getNetwork();
//       const currentChainId = network.chainId;
//       console.log('useWeb3: Current chain ID:', currentChainId);
//       console.log('useWeb3: Expected chain ID:', chainId);
//       if (currentChainId !== parseInt(chainId)) {
//         try {
//           console.log('useWeb3: Switching to chain:', chainId);
//           await window.ethereum.request({
//             method: 'wallet_switchEthereumChain',
//             params: [{ chainId: `0x${parseInt(chainId).toString(16)}` }]
//           });
//         } catch (switchError) {
//           if (switchError.code === 4902) {
//             console.log('useWeb3: Adding Hardhat network');
//             await window.ethereum.request({
//               method: 'wallet_addEthereumChain',
//               params: [
//                 {
//                   chainId: `0x${parseInt(chainId).toString(16)}`,
//                   chainName: 'Hardhat Local',
//                   rpcUrls: ['http://127.0.0.1:8545'],
//                   nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
//                 }
//               ]
//             });
//           } else {
//             throw new Error(`Network switch failed: ${switchError.message}`);
//           }
//         }
//       }
//       setProvider(web3Provider);

//       const doArt = new ethers.Contract(
//         config[network.chainId]?.doArt?.address || '0x0',
//         DoArtABI.abi,
//         web3Provider
//       );
//       const escrowStorage = new ethers.Contract(
//         config[network.chainId]?.escrowStorage?.address || '0x0',
//         EscrowStorageABI.abi,
//         web3Provider
//       );
//       const escrowListings = new ethers.Contract(
//         config[network.chainId]?.escrowListings?.address || '0x0',
//         EscrowListingsABI.abi,
//         web3Provider
//       );
//       const escrowAuctions = new ethers.Contract(
//         config[network.chainId]?.escrowAuctions?.address || '0x0',
//         EscrowAuctionsABI.abi,
//         web3Provider
//       );
//       const escrowLazyMinting = new ethers.Contract(
//         config[network.chainId]?.escrowLazyMinting?.address || '0x0',
//         EscrowLazyMintingABI.abi,
//         web3Provider
//       );

//       setContracts({
//         doArt,
//         escrowStorage,
//         escrowListings,
//         escrowAuctions,
//         escrowLazyMinting
//       });

//       const accounts = await window.ethereum.request({
//         method: 'eth_accounts'
//       });
//       if (accounts.length > 0) {
//         const address = ethers.utils.getAddress(accounts[0]);
//         const newSigner = web3Provider.getSigner();
//         setAccount(address);
//         setSigner(newSigner);
//         setContracts({
//           doArt: doArt.connect(newSigner),
//           escrowStorage: escrowStorage.connect(newSigner),
//           escrowListings: escrowListings.connect(newSigner),
//           escrowAuctions: escrowAuctions.connect(newSigner),
//           escrowLazyMinting: escrowLazyMinting.connect(newSigner)
//         });
//         toast.success(
//           `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
//           { id: 'connect-wallet' }
//         );
//       }
//     } catch (err) {
//       setError(err.message);
//       toast.error(`Web3 initialization failed: ${err.message}`, {
//         id: 'web3-init'
//       });
//       console.error('Web3 error:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [chainId]);

//   useEffect(() => {
//     initWeb3();
//   }, [initWeb3]);

//   const connectWallet = useCallback(async () => {
//     console.log('useWeb3: connectWallet called');
//     if (!window.ethereum) {
//       toast.error('Please install MetaMask!', { id: 'metamask-error' });
//       console.error('useWeb3: MetaMask not detected in connectWallet');
//       return;
//     }
//     try {
//       const accounts = await window.ethereum.request({
//         method: 'eth_requestAccounts'
//       });
//       if (accounts.length === 0) {
//         throw new Error('No accounts selected');
//       }
//       const address = ethers.utils.getAddress(accounts[0]);
//       const web3Provider =
//         provider || new ethers.providers.Web3Provider(window.ethereum, 'any');
//       const newSigner = web3Provider.getSigner();
//       setAccount(address);
//       setSigner(newSigner);
//       setContracts((prev) => ({
//         doArt: prev.doArt?.connect(newSigner) || prev.doArt,
//         escrowStorage:
//           prev.escrowStorage?.connect(newSigner) || prev.escrowStorage,
//         escrowListings:
//           prev.escrowListings?.connect(newSigner) || prev.escrowListings,
//         escrowAuctions:
//           prev.escrowAuctions?.connect(newSigner) || prev.escrowAuctions,
//         escrowLazyMinting:
//           prev.escrowLazyMinting?.connect(newSigner) || prev.escrowLazyMinting
//       }));
//       toast.success(
//         `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
//         { id: 'connect-wallet' }
//       );
//     } catch (err) {
//       setAccount(null);
//       setSigner(null);
//       toast.error(`Connection failed: ${err.message}`, { id: 'connect-error' });
//       console.error('Connect wallet error:', err);
//     }
//   }, [provider]);

//   useEffect(() => {
//     if (window.ethereum) {
//       console.log('useWeb3: Setting up event listeners');
//       const handleAccountsChanged = async (accounts) => {
//         console.log('useWeb3: Accounts changed:', accounts);
//         if (accounts.length === 0) {
//           setAccount(null);
//           setSigner(null);
//           setContracts((prev) => ({
//             doArt: prev.doArt?.connect(provider) || prev.doArt,
//             escrowStorage:
//               prev.escrowStorage?.connect(provider) || prev.escrowStorage,
//             escrowListings:
//               prev.escrowListings?.connect(provider) || prev.escrowListings,
//             escrowAuctions:
//               prev.escrowAuctions?.connect(provider) || prev.escrowAuctions,
//             escrowLazyMinting:
//               prev.escrowLazyMinting?.connect(provider) ||
//               prev.escrowLazyMinting
//           }));
//           toast.info('Wallet disconnected', { id: 'wallet-disconnect' });
//         } else if (!account) {
//           const address = ethers.utils.getAddress(accounts[0]);
//           const web3Provider =
//             provider ||
//             new ethers.providers.Web3Provider(window.ethereum, 'any');
//           const newSigner = web3Provider.getSigner();
//           setAccount(address);
//           setSigner(newSigner);
//           setContracts((prev) => ({
//             doArt: prev.doArt?.connect(newSigner) || prev.doArt,
//             escrowStorage:
//               prev.escrowStorage?.connect(newSigner) || prev.escrowStorage,
//             escrowListings:
//               prev.escrowListings?.connect(newSigner) || prev.escrowListings,
//             escrowAuctions:
//               prev.escrowAuctions?.connect(newSigner) || prev.escrowAuctions,
//             escrowLazyMinting:
//               prev.escrowLazyMinting?.connect(newSigner) ||
//               prev.escrowLazyMinting
//           }));
//           toast.success(
//             `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
//             { id: 'connect-wallet' }
//           );
//         }
//       };

//       const handleChainChanged = () => {
//         console.log('useWeb3: Chain changed');
//         setAccount(null);
//         setSigner(null);
//         setContracts({});
//         window.location.reload();
//       };

//       window.ethereum.on('accountsChanged', handleAccountsChanged);
//       window.ethereum.on('chainChanged', handleChainChanged);

//       return () => {
//         window.ethereum.removeListener(
//           'accountsChanged',
//           handleAccountsChanged
//         );
//         window.ethereum.removeListener('chainChanged', handleChainChanged);
//       };
//     } else {
//       setError('MetaMask not detected. Please install MetaMask.');
//       setIsLoading(false);
//     }
//   }, [provider, account]);

//   return {
//     provider,
//     signer,
//     account,
//     contracts,
//     isLoading,
//     error,
//     connectWallet
//   };
// }
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import DoArtABI from '../abis/DoArt.json';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import EscrowListingsABI from '../abis/EscrowListings.json';
import EscrowAuctionsABI from '../abis/EscrowAuctions.json';
import EscrowLazyMintingABI from '../abis/EscrowLazyMinting.json';
import config from '../config';

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const chainId = import.meta.env.VITE_CHAIN_ID;

  const initWeb3 = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAccount(null);
    setSigner(null);
    setContracts({});
    try {
      if (!window.ethereum) {
        throw new Error(
          'MetaMask not installed. Please install MetaMask to use this app.'
        );
      }
      const web3Provider = new ethers.providers.Web3Provider(
        window.ethereum,
        'any'
      );
      const network = await web3Provider.getNetwork();
      const currentChainId = network.chainId;
      console.log('useWeb3: Current chain ID:', currentChainId);
      console.log('useWeb3: Expected chain ID:', chainId);
      if (currentChainId !== parseInt(chainId)) {
        try {
          console.log('useWeb3: Switching to chain:', chainId);
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${parseInt(chainId).toString(16)}` }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            console.log('useWeb3: Adding Hardhat network');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${parseInt(chainId).toString(16)}`,
                  chainName: 'Hardhat Local',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
                }
              ]
            });
          } else {
            throw new Error(`Network switch failed: ${switchError.message}`);
          }
        }
      }
      setProvider(web3Provider);

      const doArt = new ethers.Contract(
        config[network.chainId]?.doArt?.address || '0x0',
        DoArtABI.abi,
        web3Provider
      );
      const escrowStorage = new ethers.Contract(
        config[network.chainId]?.escrowStorage?.address || '0x0',
        EscrowStorageABI.abi,
        web3Provider
      );
      const escrowListings = new ethers.Contract(
        config[network.chainId]?.escrowListings?.address || '0x0',
        EscrowListingsABI.abi,
        web3Provider
      );
      const escrowAuctions = new ethers.Contract(
        config[network.chainId]?.escrowAuctions?.address || '0x0',
        EscrowAuctionsABI.abi,
        web3Provider
      );
      const escrowLazyMinting = new ethers.Contract(
        config[network.chainId]?.escrowLazyMinting?.address || '0x0',
        EscrowLazyMintingABI.abi,
        web3Provider
      );

      setContracts({
        doArt,
        escrowStorage,
        escrowListings,
        escrowAuctions,
        escrowLazyMinting
      });

      const accounts = await window.ethereum
        .request({
          method: 'eth_accounts'
        })
        .catch(() => []);
      if (accounts.length > 0) {
        const address = ethers.utils.getAddress(accounts[0]);
        const newSigner = web3Provider.getSigner();
        setAccount(address);
        setSigner(newSigner);
        setContracts({
          doArt: doArt.connect(newSigner),
          escrowStorage: escrowStorage.connect(newSigner),
          escrowListings: escrowListings.connect(newSigner),
          escrowAuctions: escrowAuctions.connect(newSigner),
          escrowLazyMinting: escrowLazyMinting.connect(newSigner)
        });
        toast.success(
          `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
          { id: 'connect-wallet' }
        );
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Web3 initialization failed: ${err.message}`, {
        id: 'web3-init'
      });
      console.error('Web3 error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    initWeb3();
  }, [initWeb3]);

  const connectWallet = useCallback(async () => {
    console.log('useWeb3: connectWallet called');
    if (!window.ethereum) {
      toast.error('Please install MetaMask!', { id: 'metamask-error' });
      console.error('useWeb3: MetaMask not detected in connectWallet');
      setError('MetaMask not detected');
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      if (accounts.length === 0) {
        throw new Error('No accounts selected');
      }
      const address = ethers.utils.getAddress(accounts[0]);
      const web3Provider =
        provider || new ethers.providers.Web3Provider(window.ethereum, 'any');
      const newSigner = web3Provider.getSigner();
      setAccount(address);
      setSigner(newSigner);
      setContracts((prev) => ({
        doArt: prev.doArt?.connect(newSigner) || prev.doArt,
        escrowStorage:
          prev.escrowStorage?.connect(newSigner) || prev.escrowStorage,
        escrowListings:
          prev.escrowListings?.connect(newSigner) || prev.escrowListings,
        escrowAuctions:
          prev.escrowAuctions?.connect(newSigner) || prev.escrowAuctions,
        escrowLazyMinting:
          prev.escrowLazyMinting?.connect(newSigner) || prev.escrowLazyMinting
      }));
      toast.success(
        `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
        { id: 'connect-wallet' }
      );
    } catch (err) {
      setAccount(null);
      setSigner(null);
      setError(`Connection failed: ${err.message}`);
      toast.error(`Connection failed: ${err.message}`, { id: 'connect-error' });
      console.error('Connect wallet error:', err);
    }
  }, [provider]);

  useEffect(() => {
    if (window.ethereum) {
      console.log('useWeb3: Setting up event listeners');
      const handleAccountsChanged = async (accounts) => {
        console.log('useWeb3: Accounts changed:', accounts);
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
          setContracts((prev) => ({
            doArt: prev.doArt?.connect(provider) || prev.doArt,
            escrowStorage:
              prev.escrowStorage?.connect(provider) || prev.escrowStorage,
            escrowListings:
              prev.escrowListings?.connect(provider) || prev.escrowListings,
            escrowAuctions:
              prev.escrowAuctions?.connect(provider) || prev.escrowAuctions,
            escrowLazyMinting:
              prev.escrowLazyMinting?.connect(provider) ||
              prev.escrowLazyMinting
          }));
          toast.info('Wallet disconnected', { id: 'wallet-disconnect' });
        } else if (!account) {
          const address = ethers.utils.getAddress(accounts[0]);
          const web3Provider =
            provider ||
            new ethers.providers.Web3Provider(window.ethereum, 'any');
          const newSigner = web3Provider.getSigner();
          setAccount(address);
          setSigner(newSigner);
          setContracts((prev) => ({
            doArt: prev.doArt?.connect(newSigner) || prev.doArt,
            escrowStorage:
              prev.escrowStorage?.connect(newSigner) || prev.escrowStorage,
            escrowListings:
              prev.escrowListings?.connect(newSigner) || prev.escrowListings,
            escrowAuctions:
              prev.escrowAuctions?.connect(newSigner) || prev.escrowAuctions,
            escrowLazyMinting:
              prev.escrowLazyMinting?.connect(newSigner) ||
              prev.escrowLazyMinting
          }));
          toast.success(
            `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
            { id: 'connect-wallet' }
          );
        }
      };

      const handleChainChanged = () => {
        console.log('useWeb3: Chain changed');
        setAccount(null);
        setSigner(null);
        setContracts({});
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener(
            'accountsChanged',
            handleAccountsChanged
          );
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    } else {
      setError('MetaMask not detected. Please install MetaMask.');
      setIsLoading(false);
    }
  }, [provider, account]);

  return {
    provider,
    signer,
    account,
    contracts,
    isLoading,
    error,
    connectWallet
  };
}
