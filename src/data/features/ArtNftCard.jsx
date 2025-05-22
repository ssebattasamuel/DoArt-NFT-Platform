import styled from 'styled-components';
import { formatCurrency } from '../../utils/helpers';
import Button from '../../ui/Button';
import { useState } from 'react';
import CreateNftForm from './CreateNftForm';
import { HiPencil } from 'react-icons/hi';

const ContainerCard = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s;
  width: 250px;
  margin: 1.25rem;

  &:hover {
    transform: scale(1.05);
  }
`;

const Img = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  object-position: center;
  transform: scale(1.5) translateX(-7px);
`;
const Info = styled.div`
  padding: 0.9rem;
`;

const ArtNft = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-grey-600);
  font-family: 'Sono';
`;

const Price = styled.div`
  font-family: 'Sono';
  font-weight: 600;
  color: #0070f3;
`;

function ArtNftCard({ artNft }) {
  const [showForm, setShowForm] = useState(false);

  const { title, purchasePrice, image, description } = artNft;

  return (
    <>
      <ContainerCard>
        <Img src={image} />
        <Info>
          <ArtNft>{title}</ArtNft>
          <Price>{formatCurrency(purchasePrice)}</Price>
          <div>{description}</div>
        </Info>
        <Button onClick={() => setShowForm((show) => !show)}>
          <HiPencil />
        </Button>
      </ContainerCard>
      {showForm && <CreateNftForm nftToEdit={artNft} />}
    </>
  );
}
export default ArtNftCard;

/*{const ArtNftCard = ({ nft }) => {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
      if (nft.isAuction) {
        const interval = setInterval(() => {
          const now = Date.now() / 1000;
          const time = nft.endTime - now;
          if (time <= 0) {
            setTimeLeft('Ended');
            clearInterval(interval);
          } else {
            const hours = Math.floor(time / 3600);
            const minutes = Math.floor((time % 3600) / 60);
            setTimeLeft(`${hours}h ${minutes}m`);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [nft]);

    return (
      <div>
        <h3>Token #{nft.tokenId}</h3>
        <p>Min Bid: {ethers.utils.formatEther(nft.minBid)} ETH</p>
        {nft.isAuction && <p>Time Left: {timeLeft}</p>}
        {/* Add bid button if needed */}
      </div>
    );
  };}*/
