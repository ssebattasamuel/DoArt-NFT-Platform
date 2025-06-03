import { useState } from 'react';
import { ethers } from 'ethers';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Spinner from '../ui/Spinner';
import DoArtABI from '../abis/DoArt.json';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import EscrowListingsABI from '../abis/EscrowListings.json'; // Assuming you have this ABI
import config from '../config';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
`;

const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;

const ListingCard = styled.div`
  border: 1px solid var(--color-grey-200);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  text-align: center;
`;

function Trades({ provider, signer }) {
  const chainId = import.meta.env.VITE_CHAIN_ID;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [price, setPrice] = useState('');
  const [isAuction, setIsAuction] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState(24); // Hours
  const [listings, setListings] = useState([]);

  const fetchListings = async () => {
    if (!provider) return;
    const escrowStorage = new ethers.Contract(
      config[chainId].escrowStorage.address,
      EscrowStorageABI.abi,
      provider
    );
    const listingsData = await escrowStorage.getListings().catch(() => []);
    setListings(listingsData);
  };

  useState(() => {
    fetchListings();
  }, [provider]);

  const handleListNFT = async (e) => {
    e.preventDefault();
    if (!signer) return;
    setIsLoading(true);
    setError(null);

    try {
      const doArt = new ethers.Contract(
        config[chainId].doArt.address,
        DoArtABI.abi,
        signer
      );
      const escrowListings = new ethers.Contract(
        config[chainId].escrowListings.address, // Add this to config.js
        EscrowListingsABI.abi,
        signer
      );

      const tokenId = (await doArt.totalSupply()).toNumber() + 1;
      const metadataURI = 'ipfs://example-metadata-uri'; // Replace with actual URI
      await doArt.mint(metadataURI, 500); // 5% royalty
      await escrowListings.list(
        config[chainId].doArt.address,
        tokenId,
        ethers.constants.AddressZero,
        ethers.utils.parseEther(price),
        isAuction ? ethers.utils.parseEther(price) : 0,
        ethers.utils.parseEther('0.1'), // Escrow amount
        isAuction,
        isAuction ? auctionDuration * 3600 : 0 // Convert hours to seconds
      );
      await fetchListings();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (listing) => {
    if (!signer) return;
    setIsLoading(true);
    setError(null);

    try {
      const escrowListings = new ethers.Contract(
        config[chainId].escrowListings.address,
        EscrowListingsABI.abi,
        signer
      );
      await escrowListings.finalizeSale(
        listing.nftContract,
        listing.tokenId, // Adjust based on actual tokenId logic
        { value: listing.price }
      );
      await fetchListings();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Row type="horizontal">
        <Heading as="h1">Trades</Heading>
      </Row>
      <Row>
        <Form onSubmit={handleListNFT}>
          <input
            type="number"
            placeholder="Price (ETH)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <label>
            <input
              type="checkbox"
              checked={isAuction}
              onChange={(e) => setIsAuction(e.target.checked)}
            />{' '}
            Auction
          </label>
          {isAuction && (
            <input
              type="number"
              placeholder="Duration (hours)"
              value={auctionDuration}
              onChange={(e) => setAuctionDuration(e.target.value)}
              required
            />
          )}
          <button type="submit">List NFT</button>
        </Form>
      </Row>
      <Row>
        <ListingsGrid>
          {listings.map((listing, index) => (
            <ListingCard key={index}>
              <h3>NFT #{index + 1}</h3>
              <p>Price: {ethers.utils.formatEther(listing.price)} ETH</p>
              <p>Status: {listing.isAuction ? 'Auction' : 'Fixed Price'}</p>
              <button onClick={() => handleBuy(listing)}>Buy Now</button>
            </ListingCard>
          ))}
        </ListingsGrid>
      </Row>
    </div>
  );
}

export default Trades;
