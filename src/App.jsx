// src/App.jsx
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
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
      staleTime: 5000,
    },
  },
});

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initWeb3 = async () => {
      setIsLoading(true);
      try {
        let web3Provider;

        if (window.ethereum) {
          web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        } else {
          console.warn('MetaMask not detected. Using Hardhat node.');
          web3Provider = new ethers.providers.JsonRpcProvider(
            'http://127.0.0.1:8545'
          );
        }

        setProvider(web3Provider);
      } catch (error) {
        console.error('Web3 initialization failed:', error);
        setProvider(null);
      } finally {
        setIsLoading(false);
      }
    };
    initWeb3();
  }, []);

  if (isLoading) {
    return <div>Loading Web3 provider...</div>;
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
            color: 'var(--color-grey-700)',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
