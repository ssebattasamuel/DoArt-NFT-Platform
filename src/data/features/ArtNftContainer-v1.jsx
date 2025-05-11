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
