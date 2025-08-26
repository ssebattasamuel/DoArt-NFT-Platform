import { useForm } from 'react-hook-form';
import Button from './Button';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import FileInput from './FileInput';
import Textarea from './Textarea';
import { useLazyMint } from '../hooks/useLazyMint';
import { toast } from 'react-hot-toast';

function LazyMintForm({ onCloseModal }) {
  const { createLazyMint, isCreating } = useLazyMint();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = (data) => {
    const image = data.image[0];
    createLazyMint(
      { ...data, image },
      {
        onSuccess: (voucher) => {
          // Store voucher in localStorage for testing
          const vouchers = JSON.parse(
            localStorage.getItem('lazyVouchers') || '[]'
          );
          vouchers.push(voucher);
          localStorage.setItem('lazyVouchers', JSON.stringify(vouchers));
          reset();
          onCloseModal?.();
          toast.success(
            `Lazy mint voucher created for token #${voucher.tokenId}`
          );
        }
      }
    );
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} type="modal">
      <FormRow label="Type">Create Lazy Mint Voucher for NFTs</FormRow>
      <FormRow label="Title" error={errors?.title?.message}>
        <Input
          type="text"
          id="title"
          disabled={isCreating}
          {...register('title', { required: 'This field is required' })}
        />
      </FormRow>
      <FormRow label="Price (ETH)" error={errors?.price?.message}>
        <Input
          type="number"
          step="0.01"
          id="price"
          disabled={isCreating}
          {...register('price', {
            required: 'This field is required',
            validate: (v) => v > 0 || 'Price must be positive'
          })}
        />
      </FormRow>
      <FormRow label="Description" error={errors?.description?.message}>
        <Textarea
          id="description"
          disabled={isCreating}
          {...register('description', { required: 'This field is required' })}
        />
      </FormRow>
      <FormRow label="Image" error={errors?.image?.message}>
        <FileInput
          id="image"
          accept="image/*"
          disabled={isCreating}
          {...register('image', { required: 'This field is required' })}
        />
      </FormRow>
      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
        <Button disabled={isCreating}>Create Voucher</Button>
      </FormRow>
    </Form>
  );
}

export default LazyMintForm;
