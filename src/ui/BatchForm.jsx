import { useForm, useFieldArray } from 'react-hook-form';
import styled from 'styled-components';
import Button from './Button';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import FileInput from './FileInput';
import Textarea from './Textarea';
import { useWeb3 } from '../hooks/useWeb3';
import Heading from './Heading';

const StyledBatchForm = styled(Form)`
  max-width: 800px;
`;

const ItemContainer = styled.div`
  border: 1px solid var(--color-grey-200);
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: var(--border-radius-sm);
`;

const RemoveButton = styled(Button)`
  margin-left: auto;
`;

function BatchForm({ type, onSubmit, onCloseModal }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: { items: [{}] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const { signer } = useWeb3();

  const isMint = type === 'mint';
  const isList = type === 'list';
  const isBid = type === 'bid' || type === 'auctionBid';

  const handleFormSubmit = (data) => {
    onSubmit(data.items, signer, {
      onSuccess: () => {
        reset();
        onCloseModal?.();
      }
    });
  };

  return (
    <StyledBatchForm onSubmit={handleSubmit(handleFormSubmit)} type="modal">
      <Heading as="h3">
        {type === 'mint'
          ? 'Batch Mint NFTs'
          : type === 'list'
            ? 'Batch List NFTs'
            : type === 'bid'
              ? 'Batch Place Bids'
              : 'Batch Place Auction Bids'}
      </Heading>
      {fields.map((field, index) => (
        <ItemContainer key={field.id}>
          <FormRow
            label={isMint ? 'NFT Title' : isList ? 'Token ID' : 'Token ID'}
            error={
              errors.items?.[index]?.title?.message ||
              errors.items?.[index]?.tokenId?.message
            }
          >
            <Input
              type={isMint ? 'text' : 'number'}
              {...register(`items.${index}.${isMint ? 'title' : 'tokenId'}`, {
                required: 'This field is required'
              })}
            />
          </FormRow>
          {isMint && (
            <>
              <FormRow
                label="Description"
                error={errors.items?.[index]?.description?.message}
              >
                <Textarea
                  {...register(`items.${index}.description`, {
                    required: 'This field is required'
                  })}
                />
              </FormRow>
              <FormRow
                label="Image"
                error={errors.items?.[index]?.image?.message}
              >
                <FileInput
                  {...register(`items.${index}.image`, {
                    required: 'This field is required'
                  })}
                  accept="image/*"
                />
              </FormRow>
            </>
          )}
          {(isList || isBid) && (
            <FormRow
              label={isList ? 'Price (ETH)' : 'Bid Amount (ETH)'}
              error={
                errors.items?.[index]?.price?.message ||
                errors.items?.[index]?.amount?.message
              }
            >
              <Input
                type="number"
                step="0.01"
                {...register(`items.${index}.${isList ? 'price' : 'amount'}`, {
                  required: 'This field is required',
                  validate: (v) => v > 0 || 'Value must be positive'
                })}
              />
            </FormRow>
          )}
          {isList && (
            <>
              <FormRow
                label="Minimum Bid (ETH)"
                error={errors.items?.[index]?.minBid?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.minBid`, {
                    required: 'This field is required'
                  })}
                />
              </FormRow>
              <FormRow label="Auction">
                <Input
                  type="checkbox"
                  {...register(`items.${index}.isAuction`)}
                />
              </FormRow>
              {field.isAuction && (
                <FormRow
                  label="Auction Duration (hours)"
                  error={errors.items?.[index]?.auctionDuration?.message}
                >
                  <Input
                    type="number"
                    {...register(`items.${index}.auctionDuration`, {
                      required: 'Required for auctions'
                    })}
                  />
                </FormRow>
              )}
            </>
          )}
          <RemoveButton
            variation="danger"
            size="small"
            onClick={() => remove(index)}
          >
            Remove
          </RemoveButton>
        </ItemContainer>
      ))}
      <FormRow>
        <Button type="button" variation="secondary" onClick={() => append({})}>
          Add Item
        </Button>
        <Button type="submit" disabled={!signer}>
          Submit
        </Button>
        <Button
          type="button"
          variation="secondary"
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
      </FormRow>
    </StyledBatchForm>
  );
}

export default BatchForm;
/*
import { useForm, useFieldArray } from 'react-hook-form';
import styled from 'styled-components';
import Button from './Button';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import FileInput from './FileInput';
import Textarea from './Textarea';
import Heading from './Heading';

const StyledBatchForm = styled(Form)`
  max-width: 800px;
`;

const ItemContainer = styled.div`
  border: 1px solid var(--color-grey-200);
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: var(--border-radius-sm);
`;

const RemoveButton = styled(Button)`
  margin-left: auto;
`;

function BatchForm({ type, onCloseModal }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: { items: [{}] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isMint = type === 'mint';
  const isList = type === 'list';
  const isBid = type === 'bid' || type === 'auctionBid';

  return (
    <StyledBatchForm type="modal">
      <Heading as="h3">
        {type === 'mint'
          ? 'Batch Mint NFTs'
          : type === 'list'
            ? 'Batch List NFTs'
            : type === 'bid'
              ? 'Batch Place Bids'
              : 'Batch Place Auction Bids'}
      </Heading>
      {fields.map((field, index) => (
        <ItemContainer key={field.id}>
          <FormRow
            label={isMint ? 'NFT Title' : isList ? 'Token ID' : 'Token ID'}
            error={
              errors.items?.[index]?.title?.message ||
              errors.items?.[index]?.tokenId?.message
            }
          >
            <Input
              type={isMint ? 'text' : 'number'}
              {...register(`items.${index}.${isMint ? 'title' : 'tokenId'}`, {
                required: 'This field is required'
              })}
            />
          </FormRow>
          {isMint && (
            <>
              <FormRow
                label="Description"
                error={errors.items?.[index]?.description?.message}
              >
                <Textarea
                  {...register(`items.${index}.description`, {
                    required: 'This field is required'
                  })}
                />
              </FormRow>
              <FormRow
                label="Image"
                error={errors.items?.[index]?.image?.message}
              >
                <FileInput
                  {...register(`items.${index}.image`, {
                    required: 'This field is required'
                  })}
                  accept="image/*"
                />
              </FormRow>
            </>
          )}
          {(isList || isBid) && (
            <FormRow
              label={isList ? 'Price (ETH)' : 'Bid Amount (ETH)'}
              error={
                errors.items?.[index]?.price?.message ||
                errors.items?.[index]?.amount?.message
              }
            >
              <Input
                type="number"
                step="0.01"
                {...register(`items.${index}.${isList ? 'price' : 'amount'}`, {
                  required: 'This field is required',
                  validate: (v) => v > 0 || 'Value must be positive'
                })}
              />
            </FormRow>
          )}
          {isList && (
            <>
              <FormRow
                label="Minimum Bid (ETH)"
                error={errors.items?.[index]?.minBid?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.minBid`, {
                    required: 'This field is required'
                  })}
                />
              </FormRow>
              <FormRow label="Auction">
                <Input
                  type="checkbox"
                  {...register(`items.${index}.isAuction`)}
                />
              </FormRow>
              {field.isAuction && (
                <FormRow
                  label="Auction Duration (hours)"
                  error={errors.items?.[index]?.auctionDuration?.message}
                >
                  <Input
                    type="number"
                    {...register(`items.${index}.auctionDuration`, {
                      required: 'Required for auctions'
                    })}
                  />
                </FormRow>
              )}
            </>
          )}
          <RemoveButton
            variation="danger"
            size="small"
            onClick={() => remove(index)}
          >
            Remove
          </RemoveButton>
        </ItemContainer>
      ))}
      <FormRow>
        <Button type="button" variation="secondary" onClick={() => append({})}>
          Add Item
        </Button>
        <Button type="submit">Submit</Button>
        <Button
          type="button"
          variation="secondary"
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
      </FormRow>
    </StyledBatchForm>
  );
}

export default BatchForm;*/
