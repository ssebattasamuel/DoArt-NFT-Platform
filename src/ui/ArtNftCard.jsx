import styled from 'styled-components';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Button from './Button';
import Modal from './Modal';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import { useWeb3 } from '../hooks/useWeb3';
import { useBid } from '../hooks/useBid';
import { useAuctionBid } from '../hooks/useAuctionBid';
import { useAcceptBid } from '../hooks/useAcceptBid';
import { useEndAuction } from '../hooks/useEndAuction';
import { useEditNft } from '../hooks/useEditNft';
import { formatCurrency } from '../utils/helpers';

const Card = styled.div`
  background: var(--color-grey-0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  width: 100%;
  max-width: 300px;
  margin: 1rem;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const Image = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
`;

const Info = styled.div`
  padding: 1rem;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-grey-800);
  margin-bottom: 0.5rem;
`;

const Price = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-brand-600);
  margin-bottom: 0.5rem;
`;

const Status = styled.div`
  font-size: 1rem;
  color: var(--color-grey-500);
  margin-bottom: 0.5rem;
`;

const BidHistory = styled.ul`
  list-style: none;
  max-height: 100px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--color-grey-50);
  border-radius: var(--border-radius-sm);
`;

const BidItem = styled.li`
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
`;

function BidForm({ onSubmit, isLoading, onCloseModal, nftName }) {
  const [bidAmount, setBidAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(bidAmount) <= 0) {
      toast.error('Bid amount must be positive');
      return;
    }
    onSubmit(bidAmount);
  };

  return (
    <Form onSubmit={handleSubmit} type="modal">
      <FormRow label="Bid Amount (ETH)">
        <Input
          type="number"
          step="0.01"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          required
        />
      </FormRow>
      <FormRow>
        <Button
          variation="secondary"
          onClick={onCloseModal}
          aria-label={`Cancel bid for NFT ${nftName}`}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          aria-label={`Submit bid for NFT ${nftName}`}
        >
          {isLoading ? 'Placing Bid...' : 'Place Bid'}
        </Button>
      </FormRow>
    </Form>
  );
}

function ArtNftCard({ nft }) {
  const {
    contractAddress,
    tokenId,
    listing,
    auction,
    metadata,
    bids = []
  } = nft;
  const { signer, account, contracts } = useWeb3();
  const { placeBid, isBidding } = useBid();
  const { placeAuctionBid, isAuctionBidding } = useAuctionBid();
  const { acceptBid: acceptBidMutation, isAccepting } = useAcceptBid();
  const { endAuction: endAuctionMutation, isEnding } = useEndAuction();
  const { editNft, isEditing } = useEditNft();
  const queryClient = useQueryClient();
  const [newPrice, setNewPrice] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!auction?.isActive || !auction?.endTime) return;
    const interval = setInterval(() => {
      const time = auction.endTime * 1000 - Date.now();
      if (time <= 0) {
        setTimeLeft('Ended');
        clearInterval(interval);
      } else {
        const hours = Math.floor(time / 3600000);
        const minutes = Math.floor((time % 3600000) / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  const buyMutation = useMutation({
    mutationFn: async () => {
      const tx = await contracts.escrowListings.depositEarnest(
        contractAddress,
        tokenId,
        { value: listing?.escrowAmount }
      );
      await tx.wait();
      const approveTx = await contracts.escrowListings.approveArtwork(
        contractAddress,
        tokenId,
        true
      );
      await tx.wait();
    },
    onSuccess: () => {
      toast.success('Purchase successful!');
      queryClient.invalidateQueries(['artNfts']);
    },
    onError: (error) => toast.error(`Purchase failed: ${error.message}`)
  });

  const isOwner = listing?.seller?.toLowerCase() === account?.toLowerCase();
  const isAuctionActive =
    auction && auction.isActive && auction.endTime * 1000 > Date.now();

  if (!signer) {
    return (
      <Card>
        <Info>Connect wallet to view NFT actions</Info>
      </Card>
    );
  }

  return (
    <Card>
      <Image
        src={
          metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') ||
          'https://via.placeholder.com/300'
        }
        alt={metadata?.name || `NFT ${tokenId}`}
      />
      <Info>
        <Title>{metadata?.name || `Token #${tokenId}`}</Title>
        {listing?.isListed && !isAuctionActive ? (
          <>
            <Price>
              {formatCurrency(ethers.utils.formatEther(listing.price), 'ETH')}
            </Price>
            <Status>For Sale</Status>
            {!isOwner && (
              <Button
                onClick={() => buyMutation.mutate()}
                disabled={buyMutation.isLoading}
                variation="primary"
                size="medium"
                aria-label={`Buy NFT ${metadata?.name || `Token #${tokenId}`} for ${ethers.utils.formatEther(listing.price)} ETH`}
              >
                {buyMutation.isLoading ? 'Processing...' : 'Buy Now'}
              </Button>
            )}
            {isOwner && (
              <Modal>
                <Modal.Open opens={`edit-price-${tokenId}`}>
                  <Button variation="secondary" size="medium">
                    Edit Price
                  </Button>
                </Modal.Open>
                <Modal.Window name={`edit-price-${tokenId}`}>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      editNft(
                        {
                          newNftData: { purchasePrice: newPrice },
                          id: tokenId,
                          contractAddress
                        },
                        {
                          onSuccess: () => {
                            toast.success('Price updated successfully');
                            setNewPrice('');
                            queryClient.invalidateQueries(['artNfts']);
                          },
                          onError: (err) =>
                            toast.error(
                              `Failed to update price: ${err.message}`
                            )
                        }
                      );
                    }}
                    type="modal"
                  >
                    <FormRow label="New Price (ETH)">
                      <Input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        required
                      />
                    </FormRow>
                    <FormRow>
                      <Button
                        variation="secondary"
                        onClick={() => setNewPrice('')}
                        disabled={isEditing}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isEditing}>
                        {isEditing ? 'Updating...' : 'Update Price'}
                      </Button>
                    </FormRow>
                  </Form>
                </Modal.Window>
              </Modal>
            )}
          </>
        ) : isAuctionActive ? (
          <>
            <Price>
              {auction?.highestBid
                ? formatCurrency(
                    ethers.utils.formatEther(auction.highestBid),
                    'ETH'
                  )
                : '--'}
            </Price>
            <Status>Highest Bid (Ends in {timeLeft || '--'})</Status>
            {!isOwner && (
              <Modal>
                <Modal.Open opens={`auction-bid-${tokenId}`}>
                  <Button
                    variation="primary"
                    size="medium"
                    aria-label={`Place auction bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
                  >
                    Place Auction Bid
                  </Button>
                </Modal.Open>
                <Modal.Window name={`auction-bid-${tokenId}`}>
                  <BidForm
                    onSubmit={(amount) =>
                      placeAuctionBid([{ contractAddress, tokenId, amount }])
                    }
                    isLoading={isAuctionBidding}
                    onCloseModal={() => setBidAmount('')}
                    nftName={metadata?.name || `Token #${tokenId}`}
                  />
                </Modal.Window>
              </Modal>
            )}
            {isOwner && (
              <Button
                onClick={() => endAuctionMutation({ contractAddress, tokenId })}
                disabled={isEnding}
                variation="danger"
                size="medium"
                aria-label={`End auction for NFT ${metadata?.name || `Token #${tokenId}`}`}
              >
                {isEnding ? 'Ending...' : 'End Auction'}
              </Button>
            )}
          </>
        ) : (
          <>
            <Price>--</Price>
            <Status>Not Listed</Status>
            {!isAuctionActive && listing?.isListed && (
              <Modal>
                <Modal.Open opens={`bid-${tokenId}`}>
                  <Button
                    variation="primary"
                    size="medium"
                    aria-label={`Place bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
                  >
                    Place Bid
                  </Button>
                </Modal.Open>
                <Modal.Window name={`bid-${tokenId}`}>
                  <BidForm
                    onSubmit={(amount) =>
                      placeBid([{ contractAddress, tokenId, amount }])
                    }
                    isLoading={isBidding}
                    onCloseModal={() => setBidAmount('')}
                    nftName={metadata?.name || `Token #${tokenId}`}
                  />
                </Modal.Window>
              </Modal>
            )}
          </>
        )}
        {bids.length > 0 && (
          <>
            <Status>Bid History:</Status>
            <BidHistory>
              {bids.map((bid, index) => (
                <BidItem key={`${bid.bidder}-${bid.amount}-${index}`}>
                  {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}:{' '}
                  {formatCurrency(ethers.utils.formatEther(bid.amount), 'ETH')}
                  {isOwner && (
                    <Button
                      size="small"
                      variation="secondary"
                      onClick={() =>
                        acceptBidMutation({
                          contractAddress,
                          tokenId,
                          bidIndex: index
                        })
                      }
                      disabled={isAccepting}
                      aria-label={`Accept bid of ${formatCurrency(ethers.utils.formatEther(bid.amount), 'ETH')} from ${bid.bidder.slice(0, 6)}...${bid.bidder.slice(-4)} for NFT ${metadata?.name || `Token #${tokenId}`}`}
                    >
                      Accept
                    </Button>
                  )}
                </BidItem>
              ))}
            </BidHistory>
          </>
        )}
      </Info>
    </Card>
  );
}

export default ArtNftCard;
