import { useEffect } from 'react';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import BatchForm from '../ui/BatchForm';
import LazyMintForm from '../ui/LazyMintForm';
import RedeemLazyForm from '../ui/ReedemLazyForm';
import { useListNfts } from '../hooks/useListNfts';
import { useBatchMint } from '../hooks/useBatchMint';
import { useBid } from '../hooks/useBid';
import { useAuctionBid } from '../hooks/useAuctionBid';
import { useNfts } from '../hooks/useNfts';
import ArtNftContainer from '../ui/ArtNftContainer';

const Container = styled.div`
  display: grid;
  gap: 2rem;
`;

function Trades() {
  useEffect(() => {
    document.title = 'Trades - DoArt';
    return () => {
      document.title = 'DoArt';
    };
  }, []);

  const { artNfts, isLoading } = useNfts();
  const { listNfts, isListing } = useListNfts();
  const { batchMint, isMinting } = useBatchMint();
  const { placeBid, isBidding } = useBid();
  const { placeAuctionBid, isAuctionBidding } = useAuctionBid();

  return (
    <Container>
      <Row type="horizontal">
        <Heading as="h1">Trades</Heading>
      </Row>
      <Row type="horizontal">
        <Modal.Open opens="batch-mint">
          <Button disabled={isMinting}>Batch Mint</Button>
        </Modal.Open>
        <Modal.Window name="batch-mint">
          <BatchForm type="mint" onSubmit={batchMint} />
        </Modal.Window>
        <Modal.Open opens="batch-list">
          <Button disabled={isListing}>Batch List</Button>
        </Modal.Open>
        <Modal.Window name="batch-list">
          <BatchForm type="list" onSubmit={listNfts} />
        </Modal.Window>
        <Modal.Open opens="batch-bid">
          <Button disabled={isBidding}>Batch Bid</Button>
        </Modal.Open>
        <Modal.Window name="batch-bid">
          <BatchForm type="bid" onSubmit={placeBid} />
        </Modal.Window>
        <Modal.Open opens="batch-auction-bid">
          <Button disabled={isAuctionBidding}>Batch Auction Bid</Button>
        </Modal.Open>
        <Modal.Window name="batch-auction-bid">
          <BatchForm type="auctionBid" onSubmit={placeAuctionBid} />
        </Modal.Window>
        <Modal.Open opens="lazy-mint">
          <Button>Create Lazy Mint</Button>
        </Modal.Open>
        <Modal.Window name="lazy-mint">
          <LazyMintForm />
        </Modal.Window>
        <Modal.Open opens="redeem-lazy">
          <Button>Redeem Lazy Mint</Button>
        </Modal.Open>
        <Modal.Window name="redeem-lazy">
          <RedeemLazyForm />
        </Modal.Window>
      </Row>
      <Row>
        <ArtNftContainer isLoading={isLoading} />
      </Row>
    </Container>
  );
}

export default Trades;
