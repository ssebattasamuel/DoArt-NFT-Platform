import Button from './Button';
import Modal from './Modal';
import CreateNftForm from './CreateNftForm';

function AddNft() {
  console.log('AddNft rendered');
  return (
    <Modal>
      <Modal.Open opens="nft-form">
        <Button>Create NFT</Button>
      </Modal.Open>
      <Modal.Window name="nft-form">
        <CreateNftForm />
      </Modal.Window>
    </Modal>
  );
}

export default AddNft;
