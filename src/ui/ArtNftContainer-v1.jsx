import styled from 'styled-components';
import ArtNftCard from './ArtNftCard';
import Spinner from './Spinner';
import { useNfts } from '../hooks/useNfts';

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const ArtNftContainer = ({ provider, signer }) => {
  const { isLoading, artNfts, error } = useNfts();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Container>
      {artNfts.map((nft) => (
        <ArtNftCard
          key={`${nft.contractAddress}-${nft.tokenId}`}
          nft={nft}
          provider={provider}
          signer={signer}
        />
      ))}
    </Container>
  );
};

export default ArtNftContainer;
