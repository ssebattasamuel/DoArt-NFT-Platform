// import styled from 'styled-components';
// import { ethers } from 'ethers';
// import { useState, useEffect } from 'react';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'react-hot-toast';
// import Button from './Button';
// import Modal from './Modal';
// import Form from './Form';
// import FormRow from './FormRow';
// import Input from './Input';
// import Tooltip from './Tooltip.jsx';
// import { useWeb3Context } from '../context/Web3Context.jsx';
// import { useBid } from '../hooks/useBid';
// import { useAuctionBid } from '../hooks/useAuctionBid';
// import { useAcceptBid } from '../hooks/useAcceptBid';
// import { useEndAuction } from '../hooks/useEndAuction';
// import { useEditNft } from '../hooks/useEditNft';
// import { formatCurrency } from '../utils/helpers';
// import { useBurnNft } from '../hooks/useBurnNft';
// import { useSetTokenRoyalty } from '../hooks/useSetTokenRoyalty';
// import { useGetTokenDetails } from '../hooks/useGetTokenDetails';
// import { useCancelAuction } from '../hooks/useCancelAuction';
// import { getEthPriceInUsd } from '../utils/priceConverter';

// const Card = styled.div`
//   background: var(--color-grey-0);
//   border-radius: 12px;
//   overflow: hidden;
//   box-shadow: var(--shadow-md);
//   transition:
//     transform 0.3s,
//     box-shadow 0.3s;
//   width: 100%;
//   max-width: 320px;
//   margin: 1.5rem;
//   @media (max-width: 600px) {
//     max-width: 280px;
//     margin: 1rem;
//   }

//   &:hover {
//     transform: translateY(-4px);
//     box-shadow: var(--shadow-lg);
//   }
// `;

// const Image = styled.img`
//   width: 100%;
//   aspect-ratio: 1;
//   object-fit: cover;
//   border-bottom: 1px solid var(--color-grey-200);
// `;

// const Info = styled.div`
//   padding: 1.5rem;
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
// `;

// const Title = styled.h3`
//   font-size: 1.8rem;
//   font-weight: 600;
//   color: var(--color-grey-800);
// `;

// const Price = styled.div`
//   font-size: 1.4rem;
//   font-weight: 500;
//   color: var(--color-brand-600);
// `;

// const Status = styled.div`
//   font-size: 1.2rem;
//   color: var(--color-grey-600);
// `;

// const BidHistory = styled.ul`
//   list-style: none;
//   max-height: 120px;
//   overflow-y: auto;
//   padding: 0.8rem;
//   background: var(--color-grey-50);
//   border-radius: var(--border-radius-sm);
// `;

// const BidItem = styled.li`
//   font-size: 1rem;
//   margin-bottom: 0.5rem;
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// `;

// function BidForm({ onSubmit, isLoading, onCloseModal, nftName }) {
//   const [bidAmount, setBidAmount] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (parseFloat(bidAmount) <= 0) {
//       toast.error('Bid amount must be positive');
//       return;
//     }
//     onSubmit(bidAmount);
//   };

//   return (
//     <Form onSubmit={handleSubmit} type="modal">
//       <FormRow label="Bid Amount (ETH)">
//         <Tooltip text="Enter your bid amount in ETH.">
//           <Input
//             type="number"
//             step="0.01"
//             value={bidAmount}
//             onChange={(e) => setBidAmount(e.target.value)}
//             required
//             disabled={isLoading}
//           />
//         </Tooltip>
//       </FormRow>
//       <FormRow>
//         <Button
//           variation="secondary"
//           onClick={onCloseModal}
//           disabled={isLoading}
//         >
//           Cancel
//         </Button>
//         <Button type="submit" disabled={isLoading}>
//           {isLoading ? 'Placing Bid...' : 'Place Bid'}
//         </Button>
//       </FormRow>
//     </Form>
//   );
// }

// function ArtNftCard({ nft }) {
//   const {
//     contractAddress,
//     tokenId,
//     listing,
//     auction,
//     metadata,
//     bids = []
//   } = nft || {};

//   const { signer, account, contracts } = useWeb3Context();
//   const { placeBid, isBidding } = useBid();
//   const { placeAuctionBid, isAuctionBidding } = useAuctionBid();
//   const { acceptBid: acceptBidMutation, isAccepting } = useAcceptBid();
//   const { endAuction: endAuctionMutation, isEnding } = useEndAuction();
//   const { editNft, isEditing } = useEditNft();
//   const queryClient = useQueryClient();
//   const [newPrice, setNewPrice] = useState('');
//   const [timeLeft, setTimeLeft] = useState('');
//   const { burn, isBurning } = useBurnNft();
//   const { setRoyalty, isSetting } = useSetTokenRoyalty();
//   const { details, isLoading: isDetailsLoading } = useGetTokenDetails(tokenId);
//   const { cancel, isCanceling } = useCancelAuction();
//   const [royaltyRecipient, setRoyaltyRecipient] = useState('');
//   const [royaltyBps, setRoyaltyBps] = useState('');
//   const [usdPrice, setUsdPrice] = useState('');

//   useEffect(() => {
//     if (!auction?.isActive || !auction?.endTime) return;
//     const interval = setInterval(() => {
//       const time = auction.endTime * 1000 - Date.now();
//       if (time <= 0) {
//         setTimeLeft('Ended');
//         clearInterval(interval);
//       } else {
//         const hours = Math.floor(time / 3600000);
//         const minutes = Math.floor((time % 3600000) / 60000);
//         const seconds = Math.floor((time % 60000) / 1000);
//         setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
//       }
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [auction]);

//   useEffect(() => {
//     const convertToUsd = async () => {
//       if (listing?.price) {
//         try {
//           const ethPriceInUsd = await getEthPriceInUsd();
//           const priceInEth = ethers.utils.formatEther(listing.price);
//           setUsdPrice((Number(priceInEth) * ethPriceInUsd).toFixed(2));
//         } catch (error) {
//           setUsdPrice('N/A');
//         }
//       }
//     };
//     convertToUsd();
//   }, [listing?.price]);

//   const buyMutation = useMutation({
//     mutationFn: async () => {
//       const tx = await contracts.escrowListings.depositEarnest(
//         contractAddress,
//         tokenId,
//         { value: listing?.escrowAmount }
//       );
//       await tx.wait();
//       const approveTx = await contracts.escrowListings.approveArtwork(
//         contractAddress,
//         tokenId,
//         true
//       );
//       await approveTx.wait(); // Fixed: Wait for approval transaction
//     },
//     onSuccess: () => {
//       toast.success('Purchase successful!');
//       queryClient.invalidateQueries(['artNfts']);
//     },
//     onError: (error) => toast.error(`Purchase failed: ${error.message}`)
//   });

//   const isOwner = listing?.seller?.toLowerCase() === account?.toLowerCase();
//   const isAuctionActive =
//     auction && auction.isActive && auction.endTime * 1000 > Date.now();

//   if (!signer) {
//     return (
//       <Card>
//         <Info>Connect wallet to view NFT actions</Info>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <Image
//         src={
//           metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') ||
//           'https://via.placeholder.com/300'
//         }
//         alt={metadata?.name || `NFT ${tokenId}`}
//       />
//       <Info>
//         <Title>{metadata?.name || `Token #${tokenId}`}</Title>
//         {listing?.isListed && !isAuctionActive ? (
//           <>
//             <Price>
//               <Tooltip text="Price in USD and ETH, based on current market rates.">
//                 ${usdPrice} (
//                 {formatCurrency(ethers.utils.formatEther(listing.price), 'ETH')}
//                 )
//               </Tooltip>
//             </Price>
//             <Status>For Sale</Status>
//             {!isOwner && (
//               <Tooltip text="Purchase this NFT at the listed price.">
//                 <Button
//                   onClick={() => buyMutation.mutate()}
//                   disabled={buyMutation.isLoading}
//                   variation="primary"
//                   size="medium"
//                   aria-label={`Buy NFT ${metadata?.name || `Token #${tokenId}`}`}
//                 >
//                   {buyMutation.isLoading ? 'Processing...' : 'Buy Now'}
//                 </Button>
//               </Tooltip>
//             )}
//             {isOwner && (
//               <Modal>
//                 <Modal.Open opens={`edit-price-${tokenId}`}>
//                   <Tooltip text="Update the listing price for this NFT.">
//                     <Button
//                       variation="secondary"
//                       size="medium"
//                       aria-label={`Edit price for NFT ${metadata?.name || `Token #${tokenId}`}`}
//                     >
//                       Edit Price
//                     </Button>
//                   </Tooltip>
//                 </Modal.Open>
//                 <Modal.Window name={`edit-price-${tokenId}`}>
//                   <Form
//                     onSubmit={(e) => {
//                       e.preventDefault();
//                       editNft(
//                         {
//                           newNftData: { purchasePrice: newPrice },
//                           id: tokenId,
//                           contractAddress
//                         },
//                         {
//                           onSuccess: () => {
//                             toast.success('Price updated successfully');
//                             setNewPrice('');
//                             queryClient.invalidateQueries(['artNfts']);
//                           },
//                           onError: (err) =>
//                             toast.error(
//                               `Failed to update price: ${err.message}`
//                             )
//                         }
//                       );
//                     }}
//                     type="modal"
//                   >
//                     <FormRow label="New Price (ETH)">
//                       <Tooltip text="Enter the new price in ETH.">
//                         <Input
//                           type="number"
//                           step="0.01"
//                           value={newPrice}
//                           onChange={(e) => setNewPrice(e.target.value)}
//                           required
//                           disabled={isEditing}
//                         />
//                       </Tooltip>
//                     </FormRow>
//                     <FormRow>
//                       <Button
//                         variation="secondary"
//                         onClick={() => setNewPrice('')}
//                         disabled={isEditing}
//                       >
//                         Cancel
//                       </Button>
//                       <Button type="submit" disabled={isEditing}>
//                         {isEditing ? 'Updating...' : 'Update Price'}
//                       </Button>
//                     </FormRow>
//                   </Form>
//                 </Modal.Window>
//               </Modal>
//             )}
//           </>
//         ) : isAuctionActive ? (
//           <>
//             <Price>
//               <Tooltip text="Current highest bid in ETH and estimated USD value.">
//                 {auction?.highestBid
//                   ? `${formatCurrency(ethers.utils.formatEther(auction.highestBid), 'ETH')} (~$${(
//                       (Number(ethers.utils.formatEther(auction.highestBid)) *
//                         Number(usdPrice)) /
//                       Number(ethers.utils.formatEther(listing.price))
//                     ).toFixed(2)})`
//                   : '--'}
//               </Tooltip>
//             </Price>
//             <Status>Highest Bid (Ends in {timeLeft || '--'})</Status>
//             {!isOwner && (
//               <Modal>
//                 <Modal.Open opens={`auction-bid-${tokenId}`}>
//                   <Tooltip text="Place a bid for this auction in ETH.">
//                     <Button
//                       variation="primary"
//                       size="medium"
//                       aria-label={`Place auction bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
//                     >
//                       Place Auction Bid
//                     </Button>
//                   </Tooltip>
//                 </Modal.Open>
//                 <Modal.Window name={`auction-bid-${tokenId}`}>
//                   <BidForm
//                     onSubmit={(amount) =>
//                       placeAuctionBid([{ contractAddress, tokenId, amount }])
//                     }
//                     isLoading={isAuctionBidding}
//                     onCloseModal={onCloseModal}
//                     nftName={metadata?.name || `Token #${tokenId}`}
//                   />
//                 </Modal.Window>
//               </Modal>
//             )}
//             {isOwner && (
//               <Tooltip text="End the auction and select the highest bidder.">
//                 <Button
//                   onClick={() =>
//                     endAuctionMutation({ contractAddress, tokenId })
//                   }
//                   disabled={isEnding}
//                   variation="danger"
//                   size="medium"
//                   aria-label={`End auction for NFT ${metadata?.name || `Token #${tokenId}`}`}
//                 >
//                   {isEnding ? 'Ending...' : 'End Auction'}
//                 </Button>
//               </Tooltip>
//             )}
//           </>
//         ) : (
//           <>
//             <Price>--</Price>
//             <Status>Not Listed</Status>
//             {!isAuctionActive && listing?.isListed && (
//               <Modal>
//                 <Modal.Open opens={`bid-${tokenId}`}>
//                   <Tooltip text="Place a bid for this NFT in ETH.">
//                     <Button
//                       variation="primary"
//                       size="medium"
//                       aria-label={`Place bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
//                     >
//                       Place Bid
//                     </Button>
//                   </Tooltip>
//                 </Modal.Open>
//                 <Modal.Window name={`bid-${tokenId}`}>
//                   <BidForm
//                     onSubmit={(amount) =>
//                       placeBid([{ contractAddress, tokenId, amount }])
//                     }
//                     isLoading={isBidding}
//                     onCloseModal={onCloseModal}
//                     nftName={metadata?.name || `Token #${tokenId}`}
//                   />
//                 </Modal.Window>
//               </Modal>
//             )}
//           </>
//         )}
//         {(bids || []).length > 0 && (
//           <>
//             <Status>Bid History:</Status>
//             <BidHistory>
//               {(bids || []).map((bid, index) => (
//                 <BidItem key={`${bid.bidder}-${bid.amount}-${index}`}>
//                   {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}:{' '}
//                   {formatCurrency(ethers.utils.formatEther(bid.amount), 'ETH')}
//                   {isOwner && (
//                     <Tooltip text="Accept this bid to sell the NFT to the bidder.">
//                       <Button
//                         size="small"
//                         variation="secondary"
//                         onClick={() =>
//                           acceptBidMutation({
//                             contractAddress,
//                             tokenId,
//                             bidIndex: index
//                           })
//                         }
//                         disabled={isAccepting}
//                         aria-label={`Accept bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
//                       >
//                         Accept
//                       </Button>
//                     </Tooltip>
//                   )}
//                 </BidItem>
//               ))}
//             </BidHistory>
//           </>
//         )}
//         <Tooltip text="Permanently destroy this NFT (cannot be undone).">
//           <Button
//             onClick={() => burn(tokenId)}
//             disabled={isBurning}
//             variation="danger"
//             aria-label={`Burn NFT ${metadata?.name || `Token #${tokenId}`}`}
//           >
//             {isBurning ? 'Burning...' : 'Burn NFT'}
//           </Button>
//         </Tooltip>
//         <Modal>
//           <Modal.Open opens={`set-royalty-${tokenId}`}>
//             <Tooltip text="Update the royalty percentage or recipient for future sales of this NFT.">
//               <Button
//                 variation="secondary"
//                 size="medium"
//                 aria-label={`Set royalty for NFT ${metadata?.name || `Token #${tokenId}`}`}
//               >
//                 Set Royalty
//               </Button>
//             </Tooltip>
//           </Modal.Open>
//           <Modal.Window name={`set-royalty-${tokenId}`}>
//             <Form
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 setRoyalty({
//                   tokenId,
//                   recipient: royaltyRecipient,
//                   royaltyBps
//                 });
//               }}
//               type="modal"
//             >
//               <FormRow label="Royalty Recipient">
//                 <Tooltip text="Wallet address that will receive royalties.">
//                   <Input
//                     type="text"
//                     value={royaltyRecipient}
//                     onChange={(e) => setRoyaltyRecipient(e.target.value)}
//                     required
//                     disabled={isSetting}
//                   />
//                 </Tooltip>
//               </FormRow>
//               <FormRow label="Royalty BPS">
//                 <Tooltip text="Royalty percentage in basis points (100 bps = 1%).">
//                   <Input
//                     type="number"
//                     value={royaltyBps}
//                     onChange={(e) => setRoyaltyBps(e.target.value)}
//                     required
//                     disabled={isSetting}
//                   />
//                 </Tooltip>
//               </FormRow>
//               <FormRow>
//                 <Button variation="secondary" disabled={isSetting}>
//                   Cancel
//                 </Button>
//                 <Button type="submit" disabled={isSetting}>
//                   {isSetting ? 'Setting...' : 'Set Royalty'}
//                 </Button>
//               </FormRow>
//             </Form>
//           </Modal.Window>
//         </Modal>
//         <Status>
//           Royalty Recipient: {details.royaltyRecipient || 'Not set'}
//         </Status>
//         <Status>
//           Royalty:{' '}
//           {details.royaltyBps ? `${details.royaltyBps / 100}%` : 'Not set'}
//         </Status>
//       </Info>
//     </Card>
//   );
// }

// export default ArtNftCard;
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
import Tooltip from './Tooltip';
import { useWeb3Context } from '../context/Web3Context.jsx';
import { useBid } from '../hooks/useBid';
import { useAuctionBid } from '../hooks/useAuctionBid';
import { useAcceptBid } from '../hooks/useAcceptBid';
import { useEndAuction } from '../hooks/useEndAuction';
import { useEditNft } from '../hooks/useEditNft';
import { formatCurrency } from '../utils/helpers';
import { useBurnNft } from '../hooks/useBurnNft';
import { useSetTokenRoyalty } from '../hooks/useSetTokenRoyalty';
import { useGetTokenDetails } from '../hooks/useGetTokenDetails';
import { useCancelAuction } from '../hooks/useCancelAuction';
import { getEthPriceInUsd } from '../utils/priceConverter';

const Card = styled.div`
  background: var(--color-grey-0);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  width: 100%;
  max-width: 320px;
  margin: 1.5rem;
  @media (max-width: 600px) {
    max-width: 280px;
    margin: 1rem;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const Image = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-bottom: 1px solid var(--color-grey-200);
`;

const Info = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Title = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-grey-800);
`;

const Price = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--color-brand-600);
`;

const Status = styled.div`
  font-size: 1.2rem;
  color: var(--color-grey-600);
`;

const BidHistory = styled.ul`
  list-style: none;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.8rem;
  background: var(--color-grey-50);
  border-radius: var(--border-radius-sm);
`;

const BidItem = styled.li`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
        <Tooltip text="Enter your bid amount in ETH.">
          <Input
            type="number"
            step="0.01"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
            disabled={isLoading}
          />
        </Tooltip>
      </FormRow>
      <FormRow>
        <Button
          variation="secondary"
          onClick={onCloseModal}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
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
  } = nft || {};

  const { signer, account, contracts } = useWeb3Context();
  const { placeBid, isBidding } = useBid();
  const { placeAuctionBid, isAuctionBidding } = useAuctionBid();
  const { acceptBid: acceptBidMutation, isAccepting } = useAcceptBid();
  const { endAuction: endAuctionMutation, isEnding } = useEndAuction();
  const { editNft, isEditing } = useEditNft();
  const queryClient = useQueryClient();
  const [newPrice, setNewPrice] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const { burn, isBurning } = useBurnNft();
  const { setRoyalty, isSetting } = useSetTokenRoyalty();
  const { details, isLoading: isDetailsLoading } = useGetTokenDetails(tokenId);
  const { cancel, isCanceling } = useCancelAuction();
  const [royaltyRecipient, setRoyaltyRecipient] = useState('');
  const [royaltyBps, setRoyaltyBps] = useState('');
  const [usdPrice, setUsdPrice] = useState('');

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

  useEffect(() => {
    const convertToUsd = async () => {
      if (listing?.price && ethers.BigNumber.isBigNumber(listing.price)) {
        try {
          const ethPriceInUsd = await getEthPriceInUsd();
          const priceInEth = ethers.utils.formatEther(listing.price);
          setUsdPrice((Number(priceInEth) * ethPriceInUsd).toFixed(2));
        } catch (error) {
          setUsdPrice('N/A');
          toast.error('Failed to convert price to USD');
        }
      } else {
        setUsdPrice('N/A');
      }
    };
    convertToUsd();
  }, [listing?.price]);

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!listing?.escrowAmount) throw new Error('Invalid escrow amount');
      const tx = await contracts.escrowListings.depositEarnest(
        contractAddress,
        tokenId,
        { value: listing.escrowAmount }
      );
      await tx.wait();
      const approveTx = await contracts.escrowListings.approveArtwork(
        contractAddress,
        tokenId,
        true
      );
      await approveTx.wait();
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
              <Tooltip text="Price in USD and ETH, based on current market rates.">
                {usdPrice !== 'N/A'
                  ? `$${usdPrice} (${formatCurrency(ethers.utils.formatEther(listing.price), 'ETH')})`
                  : 'Price unavailable'}
              </Tooltip>
            </Price>
            <Status>For Sale</Status>
            {!isOwner && (
              <Tooltip text="Purchase this NFT at the listed price.">
                <Button
                  onClick={() => buyMutation.mutate()}
                  disabled={buyMutation.isLoading || usdPrice === 'N/A'}
                  variation="primary"
                  size="medium"
                  aria-label={`Buy NFT ${metadata?.name || `Token #${tokenId}`}`}
                >
                  {buyMutation.isLoading ? 'Processing...' : 'Buy Now'}
                </Button>
              </Tooltip>
            )}
            {isOwner && (
              <Modal>
                <Modal.Open opens={`edit-price-${tokenId}`}>
                  <Tooltip text="Update the listing price for this NFT.">
                    <Button
                      variation="secondary"
                      size="medium"
                      aria-label={`Edit price for NFT ${metadata?.name || `Token #${tokenId}`}`}
                    >
                      Edit Price
                    </Button>
                  </Tooltip>
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
                      <Tooltip text="Enter the new price in ETH.">
                        <Input
                          type="number"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          required
                          disabled={isEditing}
                        />
                      </Tooltip>
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
              <Tooltip text="Current highest bid in ETH and estimated USD value.">
                {auction?.highestBid
                  ? `${formatCurrency(ethers.utils.formatEther(auction.highestBid), 'ETH')} (~$${(
                      (Number(ethers.utils.formatEther(auction.highestBid)) *
                        Number(usdPrice)) /
                      Number(ethers.utils.formatEther(listing.price))
                    ).toFixed(2)})`
                  : '--'}
              </Tooltip>
            </Price>
            <Status>Highest Bid (Ends in {timeLeft || '--'})</Status>
            {!isOwner && (
              <Modal>
                <Modal.Open opens={`auction-bid-${tokenId}`}>
                  <Tooltip text="Place a bid for this auction in ETH.">
                    <Button
                      variation="primary"
                      size="medium"
                      aria-label={`Place auction bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
                    >
                      Place Auction Bid
                    </Button>
                  </Tooltip>
                </Modal.Open>
                <Modal.Window name={`auction-bid-${tokenId}`}>
                  <BidForm
                    onSubmit={(amount) =>
                      placeAuctionBid([{ contractAddress, tokenId, amount }])
                    }
                    isLoading={isAuctionBidding}
                    onCloseModal={onCloseModal}
                    nftName={metadata?.name || `Token #${tokenId}`}
                  />
                </Modal.Window>
              </Modal>
            )}
            {isOwner && (
              <Tooltip text="End the auction and select the highest bidder.">
                <Button
                  onClick={() =>
                    endAuctionMutation({ contractAddress, tokenId })
                  }
                  disabled={isEnding}
                  variation="danger"
                  size="medium"
                  aria-label={`End auction for NFT ${metadata?.name || `Token #${tokenId}`}`}
                >
                  {isEnding ? 'Ending...' : 'End Auction'}
                </Button>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <Price>--</Price>
            <Status>Not Listed</Status>
            {!isAuctionActive && listing?.isListed && (
              <Modal>
                <Modal.Open opens={`bid-${tokenId}`}>
                  <Tooltip text="Place a bid for this NFT in ETH.">
                    <Button
                      variation="primary"
                      size="medium"
                      aria-label={`Place bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
                    >
                      Place Bid
                    </Button>
                  </Tooltip>
                </Modal.Open>
                <Modal.Window name={`bid-${tokenId}`}>
                  <BidForm
                    onSubmit={(amount) =>
                      placeBid([{ contractAddress, tokenId, amount }])
                    }
                    isLoading={isBidding}
                    onCloseModal={onCloseModal}
                    nftName={metadata?.name || `Token #${tokenId}`}
                  />
                </Modal.Window>
              </Modal>
            )}
          </>
        )}
        {(bids || []).length > 0 && (
          <>
            <Status>Bid History:</Status>
            <BidHistory>
              {(bids || []).map((bid, index) => (
                <BidItem key={`${bid.bidder}-${bid.amount}-${index}`}>
                  {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}:{' '}
                  {formatCurrency(ethers.utils.formatEther(bid.amount), 'ETH')}
                  {isOwner && (
                    <Tooltip text="Accept this bid to sell the NFT to the bidder.">
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
                        aria-label={`Accept bid for NFT ${metadata?.name || `Token #${tokenId}`}`}
                      >
                        Accept
                      </Button>
                    </Tooltip>
                  )}
                </BidItem>
              ))}
            </BidHistory>
          </>
        )}
        <Tooltip text="Permanently destroy this NFT (cannot be undone).">
          <Button
            onClick={() => burn(tokenId)}
            disabled={isBurning}
            variation="danger"
            aria-label={`Burn NFT ${metadata?.name || `Token #${tokenId}`}`}
          >
            {isBurning ? 'Burning...' : 'Burn NFT'}
          </Button>
        </Tooltip>
        <Modal>
          <Modal.Open opens={`set-royalty-${tokenId}`}>
            <Tooltip text="Update the royalty percentage or recipient for future sales of this NFT.">
              <Button
                variation="secondary"
                size="medium"
                aria-label={`Set royalty for NFT ${metadata?.name || `Token #${tokenId}`}`}
              >
                Set Royalty
              </Button>
            </Tooltip>
          </Modal.Open>
          <Modal.Window name={`set-royalty-${tokenId}`}>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                setRoyalty({
                  tokenId,
                  recipient: royaltyRecipient,
                  royaltyBps
                });
              }}
              type="modal"
            >
              <FormRow label="Royalty Recipient">
                <Tooltip text="Wallet address that will receive royalties.">
                  <Input
                    type="text"
                    value={royaltyRecipient}
                    onChange={(e) => setRoyaltyRecipient(e.target.value)}
                    required
                    disabled={isSetting}
                  />
                </Tooltip>
              </FormRow>
              <FormRow label="Royalty BPS">
                <Tooltip text="Royalty percentage in basis points (100 bps = 1%).">
                  <Input
                    type="number"
                    value={royaltyBps}
                    onChange={(e) => setRoyaltyBps(e.target.value)}
                    required
                    disabled={isSetting}
                  />
                </Tooltip>
              </FormRow>
              <FormRow>
                <Button variation="secondary" disabled={isSetting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSetting}>
                  {isSetting ? 'Setting...' : 'Set Royalty'}
                </Button>
              </FormRow>
            </Form>
          </Modal.Window>
        </Modal>
        <Status>
          Royalty Recipient: {details.royaltyRecipient || 'Not set'}
        </Status>
        <Status>
          Royalty:{' '}
          {details.royaltyBps ? `${details.royaltyBps / 100}%` : 'Not set'}
        </Status>
      </Info>
    </Card>
  );
}

export default ArtNftCard;
