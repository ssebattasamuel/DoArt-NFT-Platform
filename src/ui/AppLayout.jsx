// src/ui/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import styled from 'styled-components';
import Modal from './Modal'; // Add import

const Main = styled.main`
  background-color: var(--color-grey-50);
  padding: 4rem 4.8rem 6.4rem;
  overflow: scroll;
`;

const StyledAppLayout = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
`;

const Container = styled.div`
  max-width: 120rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3.2rem;
`;

function AppLayout() {
  console.log('AppLayout rendered');
  return (
    <StyledAppLayout>
      <Header />
      <Main>
        <Container>
          <Modal>
            <Outlet />
          </Modal>
        </Container>
      </Main>
    </StyledAppLayout>
  );
}

export default AppLayout;
