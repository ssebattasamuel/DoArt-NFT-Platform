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
    try {
      let web3Provider;
      if (window.ethereum) {
        web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const currentChainId = await window.ethereum.request({
          method: 'eth_chainId'
        });
        if (currentChainId !== '0x7a69') {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x7a69' }]
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x7a69',
                    chainName: 'Hardhat Local',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    }
                  }
                ]
              });
            } else {
              throw new Error(`Network switch failed: ${switchError.message}`);
            }
          }
        }
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(web3Provider.getSigner());
        }
      } else {
        web3Provider = new ethers.providers.JsonRpcProvider(
          'http://127.0.0.1:8545'
        );
      }

      setProvider(web3Provider);

      // Initialize contracts
      const doArt = new ethers.Contract(
        config[chainId].doArt.address,
        DoArtABI.abi,
        web3Provider
      );
      const escrowStorage = new ethers.Contract(
        config[chainId].escrowStorage.address,
        EscrowStorageABI.abi,
        web3Provider
      );
      const escrowListings = new ethers.Contract(
        config[chainId].escrowListings.address,
        EscrowListingsABI.abi,
        web3Provider
      );
      const escrowAuctions = new ethers.Contract(
        config[chainId].escrowAuctions.address,
        EscrowAuctionsABI.abi,
        web3Provider
      );
      const escrowLazyMinting = new ethers.Contract(
        config[chainId].escrowLazyMinting.address,
        EscrowLazyMintingABI.abi,
        web3Provider
      );

      setContracts({
        doArt: signer ? doArt.connect(signer) : doArt,
        escrowStorage: signer ? escrowStorage.connect(signer) : escrowStorage,
        escrowListings: signer
          ? escrowListings.connect(signer)
          : escrowListings,
        escrowAuctions: signer
          ? escrowAuctions.connect(signer)
          : escrowAuctions,
        escrowLazyMinting: signer
          ? escrowLazyMinting.connect(signer)
          : escrowLazyMinting
      });

      if (window.ethereum) {
        const handleAccountsChanged = (accounts) => {
          setAccount(accounts[0] || null);
          setSigner(accounts[0] ? web3Provider.getSigner() : null);
          setContracts((prev) => ({
            ...prev,
            doArt: accounts[0]
              ? prev.doArt.connect(web3Provider.getSigner())
              : prev.doArt,
            escrowStorage: accounts[0]
              ? prev.escrowStorage.connect(web3Provider.getSigner())
              : prev.escrowStorage,
            escrowListings: accounts[0]
              ? prev.escrowListings.connect(web3Provider.getSigner())
              : prev.escrowListings,
            escrowAuctions: accounts[0]
              ? prev.escrowAuctions.connect(web3Provider.getSigner())
              : prev.escrowAuctions,
            escrowLazyMinting: accounts[0]
              ? prev.escrowLazyMinting.connect(web3Provider.getSigner())
              : prev.escrowLazyMinting
          }));
        };

        const handleChainChanged = () => window.location.reload();

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
          window.ethereum.removeListener(
            'accountsChanged',
            handleAccountsChanged
          );
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Web3 initialization failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [chainId]); // Dependency: only re-run if chainId changes

  useEffect(() => {
    initWeb3();
  }, [initWeb3]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
      setContracts((prev) => ({
        ...prev,
        doArt: prev.doArt.connect(provider.getSigner()),
        escrowStorage: prev.escrowStorage.connect(provider.getSigner()),
        escrowListings: prev.escrowListings.connect(provider.getSigner()),
        escrowAuctions: prev.escrowAuctions.connect(provider.getSigner()),
        escrowLazyMinting: prev.escrowLazyMinting.connect(provider.getSigner())
      }));
      toast.success(
        `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
      );
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`);
    }
  }, [provider]); // Memoize with provider dependency

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
