import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Spinner from '../ui/Spinner';
import ArtNftContainer from '../ui/ArtNftContainer-v1';
import AddNft from '../ui/AddNft';
import DoArtABI from '../abis/DoArt.json';
import EscrowStorageABI from '../abis/EscrowStorage.json';
import config from '../config';

const NftGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;

const NftCard = styled.div`
  border: 1px solid var(--color-grey-200);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  text-align: center;
`;

function Gallery({ provider, signer }) {
  const chainId = import.meta.env.VITE_CHAIN_ID;

  const {
    isLoading,
    data: nfts,
    error
  } = useQuery({
    queryKey: ['galleryNfts'],
    queryFn: async () => {
      if (!provider) throw new Error('Provider not available');
      const doArt = new ethers.Contract(
        config[chainId].doArt.address,
        DoArtABI.abi,
        provider
      );
      const escrowStorage = new ethers.Contract(
        config[chainId].escrowStorage.address,
        EscrowStorageABI.abi,
        provider
      );

      const listings = await escrowStorage.getListings().catch(() => []);
      const nftDetails = await Promise.all(
        listings.map(async (listing) => {
          const tokenId = listings.indexOf(listing) + 1; // Adjust based on actual tokenId
          const metadataUri = await doArt.tokenURI(tokenId).catch(() => '');
          let metadata = { image: '', name: 'Unnamed' };
          if (metadataUri) {
            try {
              const response = await fetch(metadataUri);
              metadata = await response.json();
            } catch {}
          }
          const { name: artistName } = await doArt
            .getArtistMetadata(listing.seller)
            .catch(() => ({ name: 'Unknown' }));
          return {
            tokenId,
            image: metadata.image || 'default-image-url.jpg',
            name: metadata.name,
            artist: artistName,
            price: listing.price
              ? ethers.utils.formatEther(listing.price)
              : '0',
            isAuction: listing.isAuction || false
          };
        })
      );
      return nftDetails;
    }
  });

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">All Art</Heading>
        <p>Filter/Sort (Coming Soon)</p>
      </Row>
      <Row>
        <AddNft provider={provider} signer={signer} />
        {nfts && nfts.length > 0 ? (
          <NftGrid>
            {nfts.map((nft) => (
              <NftCard key={nft.tokenId}>
                <img
                  src={nft.image}
                  alt={nft.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <h3>{nft.name}</h3>
                <p>Artist: {nft.artist}</p>
                <p>Price: {nft.price} ETH</p>
                <button>{nft.isAuction ? 'Place Bid' : 'Buy Now'}</button>
              </NftCard>
            ))}
          </NftGrid>
        ) : (
          <ArtNftContainer provider={provider} signer={signer} />
        )}
      </Row>
    </>
  );
}

export default Gallery;
