import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Button from './Button';
import Logo from './Logo';
import { useWeb3Context } from '../context/Web3Context.jsx';
import {
  HiOutlineHome,
  HiMiniBanknotes,
  HiMiniPaintBrush,
  HiOutlineCog6Tooth
} from 'react-icons/hi2';

const StyledHeader = styled.header`
  background-color: var(--color-grey-0);
  padding: 1.2rem 4.8rem;
  border-bottom: 1px solid var(--color-grey-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavList = styled.ul`
  display: flex;
  list-style: none;
  gap: 2rem;
  align-items: center;
`;

const NavItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WalletInfo = styled.div`
  font-size: 1.4rem;
  color: var(--color-grey-600);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

function Header() {
  const context = useWeb3Context();
  const { account, connectWallet, isLoading, error, isConnecting, retryInit } =
    context || {};

  const handleConnectWallet = () => {
    console.log('Header: Connect Wallet button clicked');
    connectWallet?.();
  };

  const handleRetryInit = () => {
    console.log('Header: Retry Initialization button clicked');
    retryInit?.();
  };

  return (
    <StyledHeader>
      <Logo />
      <NavList>
        <NavItem>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              color: isActive
                ? 'var(--color-brand-600)'
                : 'var(--color-grey-600)'
            })}
          >
            <HiOutlineHome /> Home
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to="/trades"
            style={({ isActive }) => ({
              color: isActive
                ? 'var(--color-brand-600)'
                : 'var(--color-grey-600)'
            })}
          >
            <HiMiniBanknotes /> Trades
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to="/gallery"
            style={({ isActive }) => ({
              color: isActive
                ? 'var(--color-brand-600)'
                : 'var(--color-grey-600)'
            })}
          >
            <HiMiniPaintBrush /> Art NFTs
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to="/account"
            style={({ isActive }) => ({
              color: isActive
                ? 'var(--color-brand-600)'
                : 'var(--color-grey-600)'
            })}
          >
            <HiOutlineCog6Tooth /> Account
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            to="/settings"
            style={({ isActive }) => ({
              color: isActive
                ? 'var(--color-brand-600)'
                : 'var(--color-grey-600)'
            })}
          >
            <HiOutlineCog6Tooth /> Settings
          </NavLink>
        </NavItem>
      </NavList>
      <WalletInfo>
        {isLoading ? (
          <>
            <span>Loading Web3...</span>
            <Button
              variation="secondary"
              onClick={handleRetryInit}
              disabled={isConnecting}
            >
              Retry Initialization
            </Button>
          </>
        ) : error ? (
          <>
            <span style={{ color: 'red' }}>
              {error.includes('Network fetch timed out')
                ? 'Error: Cannot connect to Hardhat node'
                : error.includes('Invalid or missing contract addresses')
                  ? 'Error: Invalid contract configuration'
                  : `Error: ${error}`}
            </span>
            <Button
              onClick={
                error.includes('Already processing eth_requestAccounts')
                  ? handleConnectWallet
                  : handleRetryInit
              }
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Retry Connection'}
            </Button>
          </>
        ) : account ? (
          `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        ) : (
          <Button onClick={handleConnectWallet} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </WalletInfo>
    </StyledHeader>
  );
}

export default Header;
