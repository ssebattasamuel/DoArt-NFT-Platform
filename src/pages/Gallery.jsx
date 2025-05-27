// src/pages/Gallery.jsx
import ArtNftContainer from '../ui/ArtNftContainer-v1';
import AddNft from '../ui/AddNft';
import Heading from '../ui/Heading';
import Row from '../ui/Row';

function Gallery({ provider, signer }) {
  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">All Art</Heading>
        <p>Filter/Sort (Coming Soon)</p>
      </Row>
      <Row>
        <AddNft />
        <ArtNftContainer provider={provider} signer={signer} />
      </Row>
    </>
  );
}

export default Gallery;
