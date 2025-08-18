// import { useState } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import styled from 'styled-components';
// import Heading from '../ui/Heading';
// import Row from '../ui/Row';
// import Spinner from '../ui/Spinner';
// import ArtNftContainer from '../ui/ArtNftContainer';
// import AddNft from '../ui/AddNft';
// import { useNfts } from '../hooks/useNfts';
// import Input from '../ui/Input';

// const FilterContainer = styled.div`
//   display: flex;
//   gap: 1rem;
//   align-items: center;
// `;

// const FilterSelect = styled.select`
//   padding: 0.5rem;
//   border-radius: 4px;
// `;

// function Gallery() {
//   const { isLoading, artNfts, error } = useNfts();
//   const queryClient = useQueryClient();
//   const [filter, setFilter] = useState('all');
//   const [search, setSearch] = useState('');

//   const safeArtNfts = artNfts || [];

//   const filteredNfts = safeArtNfts.filter((nft) => {
//     const matchesFilter =
//       filter === 'all' ||
//       (filter === 'listed' &&
//         nft?.listing?.isListed &&
//         !nft?.listing?.isAuction) ||
//       (filter === 'auction' &&
//         nft?.listing?.isAuction &&
//         nft?.auction?.isActive);
//     const matchesSearch =
//       nft?.metadata?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
//       false;
//     console.log('Gallery: Filtering NFT', {
//       tokenId: nft.tokenId,
//       isListed: nft?.listing?.isListed,
//       isAuction: nft?.listing?.isAuction,
//       isActive: nft?.auction?.isActive,
//       name: nft?.metadata?.name,
//       matchesFilter,
//       matchesSearch
//     });
//     return matchesFilter && matchesSearch;
//   });

//   if (isLoading) return <Spinner />;
//   if (error) return <div>Error: {error.message}</div>;

//   return (
//     <>
//       <Row type="horizontal">
//         <Heading as="h1">All Art</Heading>
//         <FilterContainer>
//           <FilterSelect
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//           >
//             <option value="all">All</option>
//             <option value="listed">Listed</option>
//             <option value="auction">Auctions</option>
//           </FilterSelect>
//           <Input
//             type="text"
//             placeholder="Search by name..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </FilterContainer>
//       </Row>
//       <Row>
//         <AddNft />
//         <ArtNftContainer nfts={filteredNfts} />
//       </Row>
//     </>
//   );
// }

// export default Gallery;
// src/pages/Gallery.jsx
// src/pages/Gallery.jsx
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import Spinner from '../ui/Spinner';
import ArtNftContainer from '../ui/ArtNftContainer';
import AddNft from '../ui/AddNft';
import { useNfts } from '../hooks/useNfts';
import Input from '../ui/Input';

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
`;

function Gallery() {
  console.log('Gallery rendered');
  const { isLoading, artNfts, error } = useNfts();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const memoizedAddNft = useMemo(() => <AddNft />, []);

  const safeArtNfts = artNfts || [];

  const filteredNfts = safeArtNfts.filter((nft) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'listed' &&
        nft?.listing?.isListed &&
        !nft?.listing?.isAuction) ||
      (filter === 'auction' &&
        nft?.listing?.isAuction &&
        nft?.auction?.isActive);
    const matchesSearch =
      nft?.metadata?.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      false;
    console.log('Gallery: Filtering NFT', {
      tokenId: nft.tokenId,
      isListed: nft?.listing?.isListed,
      isAuction: nft?.listing?.isAuction,
      isActive: nft?.auction?.isActive,
      name: nft?.metadata?.name,
      matchesFilter,
      matchesSearch
    });
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">All Art</Heading>
        <FilterContainer>
          <FilterSelect
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="listed">Listed</option>
            <option value="auction">Auctions</option>
          </FilterSelect>
          <Input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FilterContainer>
      </Row>
      <Row>
        {memoizedAddNft}
        <ArtNftContainer nfts={filteredNfts} />
      </Row>
    </>
  );
}

export default Gallery;
