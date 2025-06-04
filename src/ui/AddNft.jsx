import { useOutletContext } from 'react-router-dom';
import Button from './Button';
import Modal from './Modal';
import CreateNftForm from './CreateNftForm';

function AddNft() {
  const { signer } = useOutletContext();
  return (
    <Modal>
      <Modal.Open opens="nft-form">
        <Button>Create NFT</Button>
      </Modal.Open>
      <Modal.Window name="nft-form">
        <CreateNftForm signer={signer} />
      </Modal.Window>
    </Modal>
  );
}

export default AddNft;
