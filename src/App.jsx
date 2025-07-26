import React from 'react';
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
import { useWeb3 } from './hooks/useWeb3';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000
    }
  }
});

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    return this.state.hasError ? (
      <div>Error: {this.state.error.message}</div>
    ) : (
      this.props.children
    );
  }
}

function App() {
  const { isLoading, error, connectWallet } = useWeb3();

  if (isLoading) return <div>Loading Web3...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles />
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route element={<AppLayout connectWallet={connectWallet} />}>
              <Route index element={<Navigate replace to="dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="trades" element={<Trades />} />
              <Route path="account" element={<Account />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
      </ErrorBoundary>
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
