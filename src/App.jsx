import { ethers } from 'ethers';

import GlobalStyles from './styles/GlobalStyles';
import Heading from './ui/Heading';
import Button from './ui/Button';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';
import Minting from './pages/Minting';
import PageNotFound from './pages/PageNotFound';
import Login from './pages/Login';

import Settings from './pages/Settings';
import Users from './pages/Users';
import AppLayout from './ui/AppLayout';
import Account from './pages/Account';
import Trades from './pages/Trades';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
    },
  },
});

function App() {
  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
  };
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {' '}
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="trades" element={<Trades />} />
            <Route path="account" element={<Account />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="minting" element={<Minting />} />
            <Route path="settings" element={<Settings />} />
            <Route path="Users" element={<Users />} />{' '}
          </Route>

          <Route path="login" element={<Login />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: '8px' }}
        toastOptions={{
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
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
