import styled from 'styled-components';
import { ethers } from 'ethers';
import { useState } from 'react';
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

function Header({ setProvider, setSigner }) {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
    } else {
      alert('Please install MetaMask!');
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
