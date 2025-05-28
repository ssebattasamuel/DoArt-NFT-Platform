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
import Minting from './pages/Minting';
import PageNotFound from './pages/PageNotFound';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Users from './pages/Users';
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

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        let web3Provider;
        if (window.ethereum) {
          web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } else {
          web3Provider = new ethers.providers.JsonRpcProvider(
            'http://127.0.0.1:8545'
          );
        }
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();
        setProvider(web3Provider);
        setSigner(signer);
        setAccount(address);
      } catch (error) {
        console.error('Web3 initialization failed:', error);
        toast.error('Failed to connect to wallet. Using read-only mode.');
        const fallbackProvider = new ethers.providers.JsonRpcProvider(
          'http://127.0.0.1:8545'
        );
        setProvider(fallbackProvider);
      }
    };
    initWeb3();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <GlobalStyles />
      <Router>
        <Routes>
          <Route
            element={
              <AppLayout
                provider={provider}
                setProvider={setProvider}
                signer={signer}
                setSigner={setSigner}
                account={account}
              />
            }
          >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="trades" element={<Trades />} />
            <Route path="account" element={<Account />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="minting" element={<Minting />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="login" element={<Login />} />
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
