import { useState } from 'react';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import BatchForm from '../ui/BatchForm';
import LazyMintForm from '../ui/LazyMintForm';
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
  const { artNfts, isLoading } = useNfts();

  const { listNfts } = useListNfts();
  const { batchMint } = useBatchMint();
  const { placeBid } = useBid();
  const { placeAuctionBid } = useAuctionBid();

  return (
    <Container>
      <Row type="horizontal">
        <Heading as="h1">Trades</Heading>
      </Row>
      <Row type="horizontal">
        <Modal>
          <Modal.Open opens="batch-mint">
            <Button>Batch Mint</Button>
          </Modal.Open>
          <Modal.Window name="batch-mint">
            <BatchForm type="mint" onSubmit={batchMint} />
          </Modal.Window>
          <Modal.Open opens="batch-list">
            <Button>Batch List</Button>
          </Modal.Open>
          <Modal.Window name="batch-list">
            <BatchForm type="list" onSubmit={listNfts} />
          </Modal.Window>
          <Modal.Open opens="batch-bid">
            <Button>Batch Bid</Button>
          </Modal.Open>
          <Modal.Window name="batch-bid">
            <BatchForm type="bid" onSubmit={placeBid} />
          </Modal.Window>
          <Modal.Open opens="batch-auction-bid">
            <Button>Batch Auction Bid</Button>
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
        </Modal>
      </Row>
      <Row>
        <ArtNftContainer isLoading={isLoading} />
      </Row>
    </Container>
  );
}

export default Trades;
/*
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import BatchForm from '../ui/BatchForm';
import LazyMintForm from '../ui/LazyMintForm';

const Container = styled.div`
  display: grid;
  gap: 2rem;
`;

function Trades() {
  return (
    <Container>
      <Row type="horizontal">
        <Heading as="h1">Trades</Heading>
      </Row>
      <Row type="horizontal">
        <Modal>
          <Modal.Open opens="batch-mint">
            <Button>Batch Mint</Button>
          </Modal.Open>
          <Modal.Window name="batch-mint">
            <BatchForm type="mint" />
          </Modal.Window>
          <Modal.Open opens="batch-list">
            <Button>Batch List</Button>
          </Modal.Open>
          <Modal.Window name="batch-list">
            <BatchForm type="list" />
          </Modal.Window>
          <Modal.Open opens="batch-bid">
            <Button>Batch Bid</Button>
          </Modal.Open>
          <Modal.Window name="batch-bid">
            <BatchForm type="bid" />
          </Modal.Window>
          <Modal.Open opens="batch-auction-bid">
            <Button>Batch Auction Bid</Button>
          </Modal.Open>
          <Modal.Window name="batch-auction-bid">
            <BatchForm type="auctionBid" />
          </Modal.Window>
          <Modal.Open opens="lazy-mint">
            <Button>Create Lazy Mint</Button>
          </Modal.Open>
          <Modal.Window name="lazy-mint">
            <LazyMintForm />
          </Modal.Window>
        </Modal>
      </Row>
      <Row></Row>
    </Container>
  );
}

export default Trades;
*/
