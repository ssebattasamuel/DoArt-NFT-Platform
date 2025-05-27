import Input from '../../ui/Input';
import Form from '../../ui/Form';
import Button from '../../ui/Button';
import FileInput from '../../ui/FileInput';
import Textarea from '../../ui/Textarea';
import FormRow from '../../ui/FormRow';
import { useForm } from 'react-hook-form';
import { useCreateNft } from './useCreateNft';
import { useEditNft } from './useEditNft';

function CreateNftForm({ nftToEdit = {}, onCloseModal }) {
  const { isCreating, createNft } = useCreateNft();

  const { isEditing, editNft } = useEditNft();

  const isWorking = isCreating || isEditing;

  const { id: editId, ...editValues } = nftToEdit;
  const isEditSession = Boolean(editId);

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: isEditSession ? editValues : {},
  });
  const { errors } = formState;

  function onSubmit(data) {
    const image = typeof data.image === 'string' ? data.image : data.image[0];

    if (isEditSession)
      editNft(
        { newNftData: { ...data }, image, id: editId },
        {
          onSuccess: (data) => {
            reset();
            onCloseModal?.();
          },
        }
      );
    else
      createNft(
        { ...data, image: image },
        {
          onSuccess: (data) => {
            reset();
            onCloseModal?.();
          },
        }
      );
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      type={onCloseModal ? 'modal' : 'regular'}
    >
      <FormRow label="Nft title" error={errors?.title?.message}>
        <Input
          type="text"
          id="title"
          disabled={isWorking}
          {...register('title', { required: 'This Field is required' })}
        />
      </FormRow>

      <FormRow label="Purchase price" error={errors?.purchasePrice?.message}>
        <Input
          type="number"
          id="purchasePrice"
          disabled={isWorking}
          {...register('purchasePrice', {
            required: 'This Field is required',
            validate: (value) => value > 0 || 'Price can not be zero',
          })}
        />
      </FormRow>

      <FormRow label="Description of art" error={errors?.descripton?.message}>
        <Textarea
          type="text"
          id="description"
          defaultValue=""
          disabled={isWorking}
          {...register('description', { required: 'This Field is required' })}
        />
      </FormRow>

      <FormRow label="Nft Image">
        <FileInput
          id="image"
          accept="image/*"
          {...register('image', {
            required: isEditSession ? false : 'This Field is required',
          })}
        />
      </FormRow>

      <FormRow>
        {/* type is an HTML attribute! */}
        <Button
          variation="secondary"
          type="reset"
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
        <Button disabled={isCreating}>Mint</Button>
      </FormRow>
    </Form>
  );
}

export default CreateNftForm;
