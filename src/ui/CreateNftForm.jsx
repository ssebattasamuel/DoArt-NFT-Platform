import { useForm } from 'react-hook-form';
import Button from './Button';
import FileInput from './FileInput';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import Textarea from './Textarea';
import { useCreateNft } from '../hooks/useCreateNft';
import { useEditNft } from '../hooks/useEditNft';

function CreateNftForm({ nftToEdit = {}, onCloseModal }) {
  const { isCreating, createEditNft: createNft } = useCreateNft();
  const { isEditing, createEditNft: editNft } = useEditNft();
  const isWorking = isCreating || isEditing;

  const { id: editId, ...editValues } = nftToEdit;
  const isEditSession = Boolean(editId);

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: isEditSession ? editValues : {},
  });
  const { errors } = formState;

  function onSubmit(data) {
    const image = typeof data.image === 'string' ? data.image : data.image[0];

    if (isEditSession) {
      editNft(
        { newNftData: { ...data, image }, id: editId },
        {
          onSuccess: () => {
            reset();
            onCloseModal?.();
          },
        }
      );
    } else {
      createNft(
        { ...data, image },
        {
          onSuccess: () => {
            reset();
            onCloseModal?.();
          },
        }
      );
    }
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      type={onCloseModal ? 'modal' : 'regular'}
    >
      <FormRow label="NFT title" error={errors?.title?.message}>
        <Input
          type="text"
          id="title"
          disabled={isWorking}
          {...register('title', { required: 'This field is required' })}
        />
      </FormRow>

      <FormRow
        label="Purchase price (ETH)"
        error={errors?.purchasePrice?.message}
      >
        <Input
          type="number"
          id="purchasePrice"
          disabled={isWorking}
          {...register('purchasePrice', {
            required: 'This field is required',
            validate: (value) => value > 0 || 'Price cannot be zero',
          })}
        />
      </FormRow>

      <FormRow label="Description" error={errors?.description?.message}>
        <Textarea
          id="description"
          disabled={isWorking}
          {...register('description', { required: 'This field is required' })}
        />
      </FormRow>

      <FormRow label="NFT Image" error={errors?.image?.message}>
        <FileInput
          id="image"
          accept="image/*"
          disabled={isWorking}
          {...register('image', {
            required: isEditSession ? false : 'This field is required',
          })}
        />
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          onClick={() => onCloseModal?.()}
          disabled={isWorking}
        >
          Cancel
        </Button>
        <Button disabled={isWorking}>
          {isEditSession ? 'Update NFT' : 'Mint NFT'}
        </Button>
      </FormRow>
    </Form>
  );
}

export default CreateNftForm;
