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
import { Web3Provider } from './context/Web3Context.jsx';
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
      staleTime: 0, // Disable caching for immediate updates
      retry: 0
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
  console.log('App rendered');
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <GlobalStyles />
        <ErrorBoundary>
          <Router
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route element={<AppLayout />}>
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
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;
