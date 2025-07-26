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

const Message = styled.p`
  text-align: center;
  font-size: 1.6rem;
  color: var(--color-grey-600);
  margin-top: 2rem;
`;

const ArtNftContainer = () => {
  const { isLoading, artNfts, error } = useNfts();

  // Guard against undefined artNfts
  const safeArtNfts = artNfts || [];

  if (isLoading) return <Spinner />;
  if (error) return <Message>Error: {error.message}</Message>;
  if (safeArtNfts.length === 0)
    return <Message>No NFTs available. Mint one to get started!</Message>;

  return (
    <Container>
      {safeArtNfts.map((nft) => (
        <ArtNftCard key={`${nft.contractAddress}-${nft.tokenId}`} nft={nft} />
      ))}
    </Container>
  );
};

export default ArtNftContainer;
