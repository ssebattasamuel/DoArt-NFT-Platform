import styled from 'styled-components';
import { ethers } from 'ethers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import DoArtABI from '../abis/DoArt.json';
import EscrowListingsABI from '../abis/EscrowListings.json';
import EscrowAuctionsABI from '../abis/EscrowAuctions.json';
import config from '../config';
import Button from './Button';
import { formatCurrency } from '../utils/helpers';

const Card = styled.div`
  background: var(--color-grey-0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: border-radius: 0.4rem;
  transition: transform 0.3s, box-shadow: 0.4rem;
  margin-bottom: 2rem;
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
  margin: 0 0 0.5rem;
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
`;

const ArtNftCard = ({ nft, provider, signer }) => {
  const { contractAddress, tokenId, listing, auction, metadata } = nft;
  const chainId = import.meta.env.VITE_CHAIN_ID;
  const queryClient = useQueryClient();

  if (!signer || !provider) {
    return (
      <Card>
        <Info>Connect wallet to view NFT actions</Info>
      </Card>
    );
  }

  const doArt = new ethers.Contract(
    config[chainId].doArt.address,
    DoArtABI.abi,
    signer
  );
  const escrowListings = new ethers.Contract(
    config[chainId].escrowListings.address,
    EscrowListingsABI.abi,
    signer
  );
  const escrowAuctions = new ethers.Contract(
    config[chainId].escrowAuctions.address,
    EscrowAuctionsABI.abi,
    signer
  );

  const buyMutation = useMutation({
    mutationFn: async () => {
      const tx = await escrowListings.depositEarnest(contractAddress, tokenId, {
        value: listing.escrowAmount,
      });
      await tx.wait();
      const approveTx = await escrowListings.approveArtwork(
        contractAddress,
        tokenId,
        true
      );
      await approveTx.wait();
    },
    onSuccess: () => {
      toast.success('Purchase successful!');
      queryClient.invalidateQueries(['artnfts']);
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });

  const bidMutation = useMutation({
    mutationFn: async () => {
      const bidAmount = ethers.utils.parseEther('0.11'); // Example bid
      const tx = await escrowAuctions.placeBid(
        contractAddress,
        [tokenId],
        [bidAmount],
        {
          value: bidAmount,
        }
      );
      await tx.wait();
    },
    onSuccess: () => {
      toast.success('Bid placed!');
      queryClient.invalidateQueries(['artnfts']);
    },
    onError: (error) => {
      toast.error(`Bid failed: ${error.message}`);
    },
  });

  return (
    <Card>
      <Image
        src={metadata?.image || 'https://via.placeholder.com/300'}
        alt={metadata?.title || `NFT ${tokenId}`}
      />
      <Info>
        <Title>{metadata?.title || `Token #${tokenId}`}</Title>
        {listing.isListed && !auction.isActive ? (
          <>
            <Price>
              {formatCurrency(ethers.utils.formatEther(listing.price), 'ETH')}
            </Price>
            <Status>For Sale</Status>
            <Button
              onClick={() => buyMutation.mutate()}
              disabled={buyMutation.isLoading}
              variation="primary"
              size="medium"
            >
              {buyMutation.isLoading ? 'Processing...' : 'Buy Now'}
            </Button>
          </>
        ) : auction.isActive ? (
          <>
            <Price>
              {formatCurrency(
                ethers.utils.formatEther(auction.highestBid),
                'ETH'
              )}
            </Price>
            <Status>Highest Bid</Status>
            <Button
              onClick={() => bidMutation.mutate()}
              disabled={bidMutation.isLoading}
              variation="primary"
              size="medium"
            >
              {buyMutation.isLoading ? 'Processing...' : 'Place Bid'}
            </Button>
          </>
        ) : (
          <>
            <Price>--</Price>
            <Status>Not Listed</Status>
          </>
        )}
      </Info>
    </Card>
  );
};

export default ArtNftCard;
