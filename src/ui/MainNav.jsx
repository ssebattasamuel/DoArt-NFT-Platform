// src/ui/MainNav.jsx
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  HiMiniBanknotes,
  HiMiniPaintBrush,
  HiOutlineCog6Tooth,
  HiOutlineHome,
} from 'react-icons/hi2';

const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;
const StyledNavLink = styled(NavLink)`
  // (same as before)
`;

function MainNav() {
  return (
    <nav>
      <NavList>
        <li>
          <StyledNavLink to="/dashboard">
            <HiOutlineHome />
            <span>Home</span>
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/trades">
            <HiMiniBanknotes />
            <span>Trades</span>
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/gallery">
            <HiMiniPaintBrush />
            <span>Art NFTs</span>
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/settings">
            <HiOutlineCog6Tooth />
            <span>Settings</span>
          </StyledNavLink>
        </li>
      </NavList>
    </nav>
  );
}

export default MainNav;
