// src/ui/Header.jsx
import styled from 'styled-components';
import { ethers } from 'ethers';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from './Button';
import Logo from './Logo';

const StyledHeader = styled.header`
  background-color: var(--color-grey-0);
  padding: 1.2rem 4.8rem;
  border-bottom: 1px solid var(--color-grey-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WalletInfo = styled.div`
  font-size: 1.4rem;
  color: var(--color-grey-600);
`;

function Header({ setProvider, setSigner, setAccount, account }) {
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast.error('Failed to connect wallet.');
    }
  };

  return (
    <StyledHeader>
      <Logo />
      <WalletInfo>
        {account ? (
          `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        ) : (
          <Button onClick={connectWallet}>Connect Wallet</Button>
        )}
      </WalletInfo>
    </StyledHeader>
  );
}

export default Header;
