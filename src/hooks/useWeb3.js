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

  const withTimeout = (promise, timeoutMs, context = 'Operation') => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${context} timed out`)), timeoutMs)
      )
    ]);
  };

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
      console.log('useWeb3: Checking MetaMask availability');
      // Wait briefly to ensure MetaMask is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('useWeb3: Initializing Web3 provider');
      const web3Provider = new ethers.providers.Web3Provider(
        window.ethereum,
        'any'
      );

      console.log('useWeb3: Fetching network');
      const network = await withTimeout(
        web3Provider.getNetwork(),
        15000,
        'Network fetch'
      );
      const currentChainId = network.chainId;
      console.log('useWeb3: Current chain ID:', currentChainId);
      console.log('useWeb3: Expected chain ID:', chainId);
      if (currentChainId !== parseInt(chainId)) {
        try {
          console.log('useWeb3: Switching to chain:', chainId);
          await withTimeout(
            window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${parseInt(chainId).toString(16)}` }]
            }),
            15000,
            'Network switch'
          );
        } catch (switchError) {
          if (switchError.code === 4902) {
            console.log('useWeb3: Adding Hardhat network');
            await withTimeout(
              window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${parseInt(chainId).toString(16)}`,
                    chainName: 'Hardhat Local',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
                  }
                ]
              }),
              15000,
              'Add Hardhat network'
            );
          } else {
            throw new Error(`Network switch failed: ${switchError.message}`);
          }
        }
      }
      setProvider(web3Provider);

      console.log('useWeb3: Validating contract addresses');
      const chainConfig = config[network.chainId];
      if (
        !chainConfig?.doArt?.address ||
        !chainConfig?.escrowStorage?.address
      ) {
        throw new Error('Invalid or missing contract addresses in config.js');
      }

      console.log('useWeb3: Initializing contracts');
      const doArt = new ethers.Contract(
        chainConfig.doArt.address,
        DoArtABI.abi,
        web3Provider
      );
      const escrowStorage = new ethers.Contract(
        chainConfig.escrowStorage.address,
        EscrowStorageABI.abi,
        web3Provider
      );
      const escrowListings = new ethers.Contract(
        chainConfig.escrowListings.address,
        EscrowListingsABI.abi,
        web3Provider
      );
      const escrowAuctions = new ethers.Contract(
        chainConfig.escrowAuctions.address,
        EscrowAuctionsABI.abi,
        web3Provider
      );
      const escrowLazyMinting = new ethers.Contract(
        chainConfig.escrowLazyMinting.address,
        EscrowLazyMintingABI.abi,
        web3Provider
      );

      // Verify contract connectivity
      console.log('useWeb3: Testing contract connectivity');
      await withTimeout(
        doArt.paused(),
        5000,
        'DoArt contract connectivity test'
      );

      setContracts({
        doArt,
        escrowStorage,
        escrowListings,
        escrowAuctions,
        escrowLazyMinting
      });

      console.log('useWeb3: Fetching accounts');
      const accounts = await withTimeout(
        window.ethereum.request({ method: 'eth_accounts' }),
        10000,
        'Account fetch'
      ).catch(() => []);
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
      console.error('useWeb3: Initialization error:', err.message, err.stack);
      setError(`Web3 initialization failed: ${err.message}`);
      toast.error(`Web3 initialization failed: ${err.message}`, {
        id: 'web3-init'
      });
    } finally {
      setIsLoading(false);
      console.log('useWeb3: Initialization complete, isLoading set to false');
    }
  }, []);

  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    console.log('useWeb3: connectWallet called');
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask.');
      toast.error('Please install MetaMask!', { id: 'metamask-error' });
      return;
    }
    if (isConnecting) {
      toast.error(
        'Please wait for the current connection attempt to complete.',
        { id: 'connect-pending' }
      );
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await withTimeout(
        window.ethereum.request({ method: 'eth_requestAccounts' }),
        10000,
        'Account request'
      );
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
      setError(null);
      toast.success(
        `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
        { id: 'connect-wallet' }
      );
    } catch (err) {
      if (err.message.includes('Already processing eth_requestAccounts')) {
        setError('Connection failed: Please unlock MetaMask and try again.');
        toast.error('Please unlock MetaMask and try again.', {
          id: 'connect-pending'
        });
      } else {
        setError(`Connection failed: ${err.message}`);
        toast.error(`Connection failed: ${err.message}`, {
          id: 'connect-error'
        });
      }
      console.error('Connect wallet error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [provider, isConnecting]);

  useEffect(() => {
    // Delay initialization to ensure MetaMask is ready
    const timer = setTimeout(() => {
      initWeb3();
    }, 500);
    return () => clearTimeout(timer);
  }, [initWeb3]);

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
          setError('Wallet disconnected. Please reconnect.');
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
          setError(null);
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
        setError('Network changed. Reloading...');
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
  }, []);

  return {
    provider,
    signer,
    account,
    contracts,
    isLoading,
    error,
    connectWallet,
    isConnecting,
    retryInit: initWeb3
  };
}
