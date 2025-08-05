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
  const { account, connectWallet, isLoading, error } = useWeb3Context();

  const handleConnectWallet = () => {
    console.log('Header: Connect Wallet button clicked');
    connectWallet();
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
          'Loading...'
        ) : error ? (
          <>
            <span style={{ color: 'red' }}>Error: {error}</span>
            <Button onClick={handleConnectWallet}>Retry Connection</Button>
          </>
        ) : account ? (
          `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        ) : (
          <Button onClick={handleConnectWallet}>Connect Wallet</Button>
        )}
      </WalletInfo>
    </StyledHeader>
  );
}

export default Header;
