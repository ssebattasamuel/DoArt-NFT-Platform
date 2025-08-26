import { createContext, useContext } from 'react';
import { useWeb3 } from '../hooks/useWeb3';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const web3 = useWeb3();
  console.log('Web3Provider: Providing context', web3);
  return <Web3Context.Provider value={web3}>{children}</Web3Context.Provider>;
}

export function useWeb3Context() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    console.error(
      'useWeb3Context: Context is undefined. Ensure component is wrapped in Web3Provider.'
    );
    return {};
  }
  return context;
}
