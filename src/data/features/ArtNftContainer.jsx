import styled from 'styled-components';

import Spinner from '../../ui/Spinner';
import ArtNftCard from './ArtNftCard';
import { useNfts } from './useNfts';

const Container = styled.div`
  /* border: 1px solid var(--color-grey-200);

  font-size: 1.4rem;
  background-color: var(--color-grey-0);
  border-radius: 7px;
  overflow: hidden; */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.25rem;
  padding: 1.25rem;
  justify-items: center;
`;

function ArtNftContainer() {
  const { isLoading, artNfts } = useNfts();
  if (isLoading) return <Spinner />;

  return (
    <Container>
      {artNfts.map((artNft) => (
        <ArtNftCard artNft={artNft} key={artNft.id} />
      ))}
    </Container>
  );
}

export default ArtNftContainer;
