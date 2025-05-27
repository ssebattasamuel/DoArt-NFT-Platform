import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import CreateNftForm from './CreateNftForm';

function AddNft() {

  return (
    <Modal>
    <Modal.Open opens='nft-form'>
      <Button>Create NFT</Button>
    </Modal.Open>
    <Modal.Window name='nft-form'>
      <CreateNftForm/>
    </Modal.Window>
  </Modal>
  ); 
//   const [isOpenModal, setIsOpenModal] = useState(false);
 
//   return (
//    <div> <Button
//    onClick={() => setIsOpenModal((show) => !show)}
//    aria-label={
//      isOpenModal ? 'Hide Create NFT Form' : 'Show Create NFT Form'
//    }
//  >
//    {isOpenModal ? 'Hide Create NFT Form' : 'Create NFT'}
//  </Button> 
//  {isOpenModal && <Modal onClose={()=>setIsOpenModal(false)}><CreateNftForm onCloseModal={()=>setIsOpenModal(false)} /></Modal>}
//  </div>
//   );
}



export default AddNft;
