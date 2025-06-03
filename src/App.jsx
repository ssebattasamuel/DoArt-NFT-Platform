// src/App.jsx
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import GlobalStyles from './styles/GlobalStyles';
import AppLayout from './ui/AppLayout';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import PageNotFound from './pages/PageNotFound';
import Settings from './pages/Settings';
import Account from './pages/Account';
import Trades from './pages/Trades';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000
    }
  }
});

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const waitForMetaMask = () => {
      return new Promise((resolve) => {
        if (window.ethereum) {
          resolve();
        } else {
          const interval = setInterval(() => {
            if (window.ethereum) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(interval);
            resolve(); // Fallback after 5 seconds
          }, 5000);
        }
      });
    };

    const initWeb3 = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Wait for MetaMask to be injected
        await waitForMetaMask();

        let web3Provider;

        if (window.ethereum) {
          console.log('MetaMask detected, initializing provider...');
          web3Provider = new ethers.providers.Web3Provider(window.ethereum);

          // Check current chainId
          const currentChainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          console.log('Current chainId:', currentChainId);

          // Switch to Hardhat network (chainId: 31337)
          if (currentChainId !== '0x7a69') {
            console.log('Switching to Hardhat network...');
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7a69' }]
              });
            } catch (switchError) {
              if (switchError.code === 4902) {
                console.log('Adding Hardhat network...');
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
                      },
                      blockExplorerUrls: null
                    }
                  ]
                });
              } else {
                throw new Error(
                  `Network switch failed: ${switchError.message}`
                );
              }
            }
          }

          // Timeout for account request
          const accounts = await Promise.race([
            window.ethereum.request({ method: 'eth_accounts' }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('MetaMask account request timed out')),
                5000
              )
            )
          ]);
          console.log('Accounts on init:', accounts);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setSigner(web3Provider.getSigner());
            console.log('Connected account:', accounts[0]);
          } else {
            console.log(
              'No accounts connected on init. Awaiting user connection...'
            );
          }
        } else {
          console.warn('MetaMask not detected. Using Hardhat node.');
          web3Provider = new ethers.providers.JsonRpcProvider(
            'http://127.0.0.1:8545'
          );
          await web3Provider.getBlockNumber().catch(() => {
            throw new Error(
              'Hardhat node not running at http://127.0.0.1:8545'
            );
          });
          console.log('Hardhat node connected successfully');
        }

        setProvider(web3Provider);

        if (window.ethereum) {
          window.ethereum.on('accountsChanged', (accounts) => {
            console.log('Accounts changed:', accounts);
            setAccount(accounts[0] || null);
            setSigner(accounts[0] ? web3Provider.getSigner() : null);
          });
          window.ethereum.on('chainChanged', (chainId) => {
            console.log('Chain changed:', chainId);
            window.location.reload();
          });
        }
      } catch (error) {
        console.error('Web3 initialization failed:', error.message);
        setError(error.message);
        setProvider(null);
      } finally {
        setIsLoading(false);
      }
    };
    initWeb3();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    try {
      console.log('Requesting MetaMask connection...');
      const accounts = await Promise.race([
        window.ethereum.request({ method: 'eth_requestAccounts' }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('MetaMask connection timed out')),
            5000
          )
        )
      ]);
      if (accounts.length === 0) {
        throw new Error('No accounts selected in MetaMask');
      }
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
      console.log('Wallet connected:', accounts[0]);
    } catch (error) {
      console.error('Wallet connection failed:', error.message);
      alert(`Connection failed: ${error.message}`);
      setAccount(null);
      setSigner(null);
    }
  };

  if (isLoading) {
    return <div>Loading Web3 provider...</div>;
  }

  if (error) {
    return <div>Error initializing Web3: {error}</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <GlobalStyles />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route
            element={
              <AppLayout
                provider={provider}
                setProvider={setProvider}
                signer={signer}
                setSigner={setSigner}
                account={account}
                setAccount={setAccount}
                connectWallet={connectWallet}
              />
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route
              path="dashboard"
              element={<Dashboard provider={provider} />}
            />
            <Route
              path="trades"
              element={<Trades provider={provider} signer={signer} />}
            />
            <Route
              path="account"
              element={<Account provider={provider} signer={signer} />}
            />
            <Route
              path="gallery"
              element={<Gallery provider={provider} signer={signer} />}
            />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: '8px' }}
        toastOptions={{
          success: { duration: 3000 },
          error: { duration: 5000 },
          style: {
            fontSize: '16px',
            maxWidth: '500px',
            padding: '16px 24px',
            backgroundColor: 'var(--color-grey-0)',
            color: 'var(--color-grey-700)'
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
