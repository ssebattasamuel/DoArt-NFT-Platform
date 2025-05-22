// import { useQuery } from '@tanstack/react-query';
// import styled from 'styled-components';
// import { getArtNfts } from '../../services/apiArtNfts';
// import Spinner from '../../ui/Spinner';
// import ArtNftCard from './ArtNftCard';

// const Container = styled.div`
//   /* border: 1px solid var(--color-grey-200);

//   font-size: 1.4rem;
//   background-color: var(--color-grey-0);
//   border-radius: 7px;
//   overflow: hidden; */
//   display: grid;
//   grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
//   gap: 1.25rem;
//   padding: 1.25rem;
//   justify-items: center;
// `;

// function ArtNftContainer() {
//   const {
//     isLoading,
//     data: artNfts,
//     error,
//   } = useQuery({
//     queryKey: ['artNft'],
//     queryFn: getArtNfts,
//   });
//   if (isLoading) return <Spinner />;

//   return (
//     <Container>
//       {artNfts.map((artNft) => (
//         <ArtNftCard artNft={artNft} key={artNft.id} />
//       ))}
//     </Container>
//   );
// }

// export default ArtNftContainer;
/*import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import escrowAbi from '../abis/Escrow.json';
import ArtNftCard from './ArtNftCard';

const ArtNftContainer = () => {
  const [nfts, setNfts] = useState([]);
  const [selectedNfts, setSelectedNfts] = useState([]);
  const [bidAmounts, setBidAmounts] = useState({});
  const escrowAddress = 'YOUR_ESCROW_ADDRESS'; // Replace with deployed address

  useEffect(() => {
    // TODO: Fetch NFTs from Supabase or Escrow.sol
    // Example: Fetch listings from Escrow.sol
    const fetchNfts = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const escrow = new ethers.Contract(escrowAddress, escrowAbi, provider);
      // Mock data for now
      setNfts([
        { tokenId: 1, isAuction: false, minBid: '0.1', price: '1' },
        { tokenId: 2, isAuction: true, minBid: '0.2', endTime: Date.now() / 1000 + 86400 },
      ]);
    };
    fetchNfts();
  }, []);

  const handleSelectNft = (tokenId) => {
    setSelectedNfts((prev) =>
      prev.includes(tokenId) ? prev.filter((id) => id !== tokenId) : [...prev, tokenId]
    );
  };

  const handleBidAmountChange = (tokenId, amount) => {
    setBidAmounts((prev) => ({ ...prev, [tokenId]: amount }));
  };

  const placeBatchBid = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const escrow = new ethers.Contract(escrowAddress, escrowAbi, signer);

    const tokenIds = selectedNfts;
    const amounts = tokenIds.map((id) => ethers.utils.parseEther(bidAmounts[id] || '0'));
    const totalValue = amounts.reduce((sum, amt) => sum.add(amt), ethers.BigNumber.from(0));

    const isAuction = nfts.find((nft) => tokenIds.includes(nft.tokenId))?.isAuction;
    try {
      if (isAuction) {
        const tx = await escrow.batchPlaceAuctionBid(escrowAddress, tokenIds, amounts, { value: totalValue });
        await tx.wait();
        alert('Batch auction bids placed!');
      } else {
        const tx = await escrow.batchPlaceBid(escrowAddress, tokenIds, amounts, { value: totalValue });
        await tx.wait();
        alert('Batch bids placed!');
      }
      setSelectedNfts([]);
      setBidAmounts({});
    } catch (error) {
      console.error(error);
      alert('Batch bidding failed');
    }
  };

  return (
    <div>
      <h2>NFT Listings</h2>
      {selectedNfts.length > 0 && (
        <button onClick={placeBatchBid}>Place Batch Bid</button>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {nfts.map((nft) => (
          <div key={nft.tokenId}>
            <input
              type="checkbox"
              checked={selectedNfts.includes(nft.tokenId)}
              onChange={() => handleSelectNft(nft.tokenId)}
            />
            <ArtNftCard nft={nft} />
            <input
              type="number"
              placeholder="Bid amount (ETH)"
              value={bidAmounts[nft.tokenId] || ''}
              onChange={(e) => handleBidAmountChange(nft.tokenId, e.target.value)}
              min={ethers.utils.formatEther(nft.minBid)}
              step="0.01"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtNftContainer; */
