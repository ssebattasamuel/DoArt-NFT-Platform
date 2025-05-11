// import ArtNftContainer from '../data/features/ArtNftContainer';
// import Heading from '../ui/Heading';
// import Row from '../ui/Row';
// import AddNft from '../data/features/AddNft';

// function Gallery() {
//   return (
//     <>
//       <Row type="horizontal">
//         <Heading as="h1">all art</Heading>
//         <p>Filter/sort</p>
//       </Row>
//       <Row>
//         <ArtNftContainer />
//         <AddNft />
//       </Row>
//     </>
//   );
// }
// export default Gallery;

import ArtNftContainer from '../data/features/ArtNftContainer';
import Heading from '../ui/Heading';
import Row from '../ui/Row';
import AddNft from '../data/features/AddNft';


import CreateNftForm from '../data/features/CreateNftForm';

function Gallery() {
  

  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">All Art</Heading>
        <p>Filter/Sort</p> 
      </Row>
      <Row>
        <ArtNftContainer />
       <AddNft/>
        
      </Row>
    </>
  );
}

export default Gallery;
