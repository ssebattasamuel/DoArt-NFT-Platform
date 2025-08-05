// import { useForm } from 'react-hook-form';
// import { useState, useEffect } from 'react';
// import styled from 'styled-components';
// import Button from './Button';
// import FileInput from './FileInput';
// import Form from './Form';
// import FormRow from './FormRow';
// import Input from './Input';
// import Textarea from './Textarea';
// import Spinner from './Spinner';
// import Tooltip from './Tooltip';
// import { useCreateNft } from '../hooks/useCreateNft';
// import { useEditNft } from '../hooks/useEditNft';
// import { useWeb3Context } from '../context/Web3Context.jsx';
// import { toast } from 'react-hot-toast';
// import { convertUsdToEth, estimateGasCostInUsd } from '../utils/priceConverter';
// import { ethers } from 'ethers';

// const StyledForm = styled(Form)`
//   max-width: 600px;
//   padding: 2rem;
//   border-radius: var(--border-radius-md);
//   background-color: var(--color-grey-50);
//   @media (max-width: 600px) {
//     padding: 1.5rem;
//   }
// `;

// function CreateNftForm({ nftToEdit = {}, onCloseModal }) {
//   const { isCreating, createNft } = useCreateNft();
//   const { isEditing, editNft } = useEditNft();
//   const {
//     contracts,
//     account,
//     error: web3Error,
//     isLoading,
//     provider
//   } = useWeb3Context();
//   const isWorking = isCreating || isEditing;

//   const {
//     id: editId,
//     contractAddress: editContractAddress,
//     ...editValues
//   } = nftToEdit;
//   const isEditSession = Boolean(editId);

//   const { register, handleSubmit, reset, formState, setValue, watch } = useForm(
//     {
//       defaultValues: isEditSession ? editValues : {}
//     }
//   );
//   const { errors } = formState;
//   const [useUsd, setUseUsd] = useState(true);
//   const [ethPrice, setEthPrice] = useState('');
//   const [usdPrice, setUsdPrice] = useState('');
//   const [gasEstimate, setGasEstimate] = useState('Calculating...');
//   const [isConverting, setIsConverting] = useState(false);
//   const priceValue = watch('purchasePrice');

//   // Validate price with debounce
//   useEffect(() => {
//     let timeout;
//     const validatePrice = () => {
//       console.log(`CreateNftForm: Validating price, value=${priceValue}`);
//       if (priceValue && Number(priceValue) <= 0) {
//         toast.error('Price must be positive', { id: 'price-error' });
//       }
//     };
//     if (priceValue) {
//       timeout = setTimeout(validatePrice, 500); // Debounce validation
//     }
//     return () => clearTimeout(timeout);
//   }, [priceValue]);

//   // Estimate gas cost
//   useEffect(() => {
//     const fetchGasEstimate = async () => {
//       try {
//         const gasLimit = ethers.BigNumber.from('200000');
//         const gasCost = await estimateGasCostInUsd(gasLimit, provider);
//         setGasEstimate(gasCost);
//       } catch (error) {
//         setGasEstimate('N/A');
//       }
//     };
//     if (provider) fetchGasEstimate();
//   }, [provider]);

//   // Handle price conversion
//   useEffect(() => {
//     let timeout;
//     const convertPrice = async () => {
//       setIsConverting(true);
//       try {
//         if (useUsd && usdPrice) {
//           const { ethAmount } = await convertUsdToEth(usdPrice);
//           setEthPrice(ethAmount);
//         } else if (!useUsd && ethPrice) {
//           const ethPriceInUsd = await getEthPriceInUsd();
//           setUsdPrice((Number(ethPrice) * ethPriceInUsd).toFixed(2));
//         }
//       } catch (error) {
//         toast.error('Failed to convert price', { id: 'convert-error' });
//       } finally {
//         setIsConverting(false);
//       }
//     };
//     timeout = setTimeout(convertPrice, 500);
//     return () => clearTimeout(timeout);
//   }, [useUsd, usdPrice, ethPrice]);

//   async function onSubmit(data) {
//     const image = typeof data.image === 'string' ? data.image : data.image[0];
//     const priceField = useUsd ? usdPrice : ethPrice;

//     try {
//       if (isEditSession) {
//         await editNft(
//           {
//             newNftData: { ...data, purchasePrice: priceField },
//             id: editId,
//             contractAddress: editContractAddress || contracts?.doArt?.address
//           },
//           {
//             onSuccess: () => {
//               reset();
//               onCloseModal?.();
//               toast.success(`NFT updated for $${usdPrice} (~${ethPrice} ETH)`);
//             }
//           }
//         );
//       } else {
//         await createNft(
//           {
//             ...data,
//             image,
//             purchasePrice: priceField,
//             isUsd: useUsd,
//             royaltyBps: data.royaltyBps || 500
//           },
//           {
//             onSuccess: () => {
//               reset();
//               onCloseModal?.();
//               toast.success(`NFT minted for $${usdPrice} (~${ethPrice} ETH)`);
//             },
//             onError: (err) => toast.error(`Failed to mint NFT: ${err.message}`)
//           }
//         );
//       }
//     } catch (err) {
//       toast.error(`Transaction failed: ${err.message}`);
//     }
//   }

//   return (
//     <div>
//       {isLoading && <Spinner />}
//       {web3Error && (
//         <p style={{ color: 'red', textAlign: 'center' }}>
//           Web3 Error: {web3Error}
//         </p>
//       )}
//       {!isLoading && !web3Error && !account && (
//         <p style={{ color: 'red', textAlign: 'center' }}>
//           Please connect your wallet to mint NFTs.
//         </p>
//       )}
//       {!isLoading &&
//         !web3Error &&
//         account &&
//         (!contracts?.doArt || !contracts?.escrowListings) && (
//           <p style={{ color: 'red', textAlign: 'center' }}>
//             Contracts not initialized. Please try again.
//           </p>
//         )}
//       {!isLoading &&
//         !web3Error &&
//         account &&
//         contracts?.doArt &&
//         contracts?.escrowListings && (
//           <StyledForm
//             onSubmit={handleSubmit(onSubmit)}
//             type={onCloseModal ? 'modal' : 'regular'}
//           >
//             <FormRow label="NFT Title" error={errors?.title?.message}>
//               <Tooltip text="The name of your NFT, displayed in the marketplace.">
//                 <Input
//                   type="text"
//                   id="title"
//                   disabled={isWorking || isConverting}
//                   {...register('title', { required: 'This field is required' })}
//                   placeholder="Enter NFT title"
//                 />
//               </Tooltip>
//             </FormRow>
//             <FormRow label="Price Currency">
//               <Tooltip text="Choose whether to set the price in USD or ETH. USD prices are converted to ETH using real-time rates.">
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={useUsd}
//                     onChange={() => setUseUsd(!useUsd)}
//                     disabled={isWorking || isConverting}
//                   />
//                   Use USD (uncheck for ETH)
//                 </label>
//               </Tooltip>
//             </FormRow>
//             <FormRow
//               label={useUsd ? 'Purchase Price (USD)' : 'Purchase Price (ETH)'}
//               error={errors?.purchasePrice?.message}
//             >
//               <Tooltip
//                 text={
//                   useUsd
//                     ? 'Enter the price in USD. It will be converted to ETH for the blockchain.'
//                     : 'Enter the price in ETH.'
//                 }
//               >
//                 <Input
//                   type="number"
//                   step={useUsd ? '0.01' : '0.0001'}
//                   id="purchasePrice"
//                   disabled={isWorking || isConverting}
//                   value={useUsd ? usdPrice : ethPrice}
//                   onChange={(e) => {
//                     const value = e.target.value;
//                     console.log(
//                       `CreateNftForm: price input changed, value=${value}, useUsd=${useUsd}`
//                     );
//                     if (useUsd) setUsdPrice(value);
//                     else setEthPrice(value);
//                     setValue('purchasePrice', value, { shouldValidate: true });
//                   }}
//                   placeholder={useUsd ? 'Enter USD amount' : 'Enter ETH amount'}
//                 />
//               </Tooltip>
//             </FormRow>
//             <FormRow label={useUsd ? 'Equivalent in ETH' : 'Equivalent in USD'}>
//               <Input
//                 type="text"
//                 disabled
//                 value={
//                   isConverting
//                     ? 'Converting...'
//                     : useUsd
//                       ? `${ethPrice} ETH`
//                       : `$${usdPrice}`
//                 }
//               />
//             </FormRow>
//             <FormRow label="Estimated Gas Cost">
//               <Tooltip text="Estimated cost of the blockchain transaction, paid in ETH. Actual cost may vary based on network conditions.">
//                 <Input type="text" disabled value={`$${gasEstimate}`} />
//               </Tooltip>
//             </FormRow>
//             <FormRow label="Description" error={errors?.description?.message}>
//               <Tooltip text="A brief description of your NFT, visible to buyers.">
//                 <Textarea
//                   id="description"
//                   disabled={isWorking || isConverting}
//                   {...register('description', {
//                     required: 'This field is required'
//                   })}
//                   placeholder="Enter NFT description"
//                 />
//               </Tooltip>
//             </FormRow>
//             <FormRow label="Royalty (bps)" error={errors?.royaltyBps?.message}>
//               <Tooltip text="Royalty percentage (in basis points, 100 bps = 1%) you earn on future sales. Can be updated later.">
//                 <Input
//                   type="number"
//                   id="royaltyBps"
//                   disabled={isWorking || isConverting}
//                   placeholder="Enter royalty in bps (e.g., 500 for 5%)"
//                   {...register('royaltyBps', {
//                     required: 'This field is required',
//                     validate: (value) =>
//                       Number(value) >= 0 || 'Royalty cannot be negative'
//                   })}
//                 />
//               </Tooltip>
//             </FormRow>
//             <FormRow label="NFT Image" error={errors?.image?.message}>
//               <Tooltip text="Upload an image for your NFT (JPEG, PNG, etc.).">
//                 <FileInput
//                   id="image"
//                   accept="image/*"
//                   disabled={isWorking || isConverting}
//                   {...register('image', {
//                     required: isEditSession ? false : 'This field is required'
//                   })}
//                 />
//               </Tooltip>
//             </FormRow>
//             <FormRow>
//               <Button
//                 variation="secondary"
//                 type="reset"
//                 onClick={() => onCloseModal?.()}
//                 disabled={isWorking || isConverting}
//               >
//                 Cancel
//               </Button>
//               <Button disabled={isWorking || isConverting}>
//                 {isWorking ? (
//                   <Spinner />
//                 ) : isEditSession ? (
//                   'Update Listing'
//                 ) : (
//                   'Mint NFT'
//                 )}
//               </Button>
//             </FormRow>
//           </StyledForm>
//         )}
//     </div>
//   );
// }

// export default CreateNftForm;
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from './Button';
import FileInput from './FileInput';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import Textarea from './Textarea';
import Spinner from './Spinner';
import Tooltip from './Tooltip';
import { useCreateNft } from '../hooks/useCreateNft';
import { useEditNft } from '../hooks/useEditNft';
import { useWeb3Context } from '../context/Web3Context.jsx';
import { toast } from 'react-hot-toast';
import { convertUsdToEth, estimateGasCostInUsd } from '../utils/priceConverter';
import { ethers } from 'ethers';

const StyledForm = styled(Form)`
  max-width: 600px;
  padding: 2rem;
  border-radius: var(--border-radius-md);
  background-color: var(--color-grey-50);
  @media (max-width: 600px) {
    padding: 1.5rem;
  }
`;

function CreateNftForm({ nftToEdit = {}, onCloseModal }) {
  const { isCreating, createNft } = useCreateNft();
  const { isEditing, editNft } = useEditNft();
  const {
    contracts,
    account,
    error: web3Error,
    isLoading,
    provider
  } = useWeb3Context();
  const isWorking = isCreating || isEditing;

  const {
    id: editId,
    contractAddress: editContractAddress,
    ...editValues
  } = nftToEdit;
  const isEditSession = Boolean(editId);

  const { register, handleSubmit, reset, formState, setValue, watch } = useForm(
    {
      defaultValues: isEditSession ? editValues : {}
    }
  );
  const { errors } = formState;
  const [useUsd, setUseUsd] = useState(true);
  const [ethPrice, setEthPrice] = useState('');
  const [usdPrice, setUsdPrice] = useState('');
  const [gasEstimate, setGasEstimate] = useState('Calculating...');
  const [isConverting, setIsConverting] = useState(false);
  const priceValue = watch('purchasePrice');

  // Validate price with debounce
  useEffect(() => {
    let timeout;
    const validatePrice = () => {
      console.log(`CreateNftForm: Validating price, value=${priceValue}`);
      if (priceValue && Number(priceValue) <= 0) {
        toast.error('Price must be positive', { id: 'price-error' });
      }
    };
    if (priceValue) {
      timeout = setTimeout(validatePrice, 500);
    }
    return () => clearTimeout(timeout);
  }, [priceValue]);

  // Estimate gas cost
  useEffect(() => {
    const fetchGasEstimate = async () => {
      try {
        const gasLimit = ethers.BigNumber.from('200000');
        const gasCost = await estimateGasCostInUsd(gasLimit, provider);
        setGasEstimate(gasCost);
      } catch (error) {
        setGasEstimate('N/A');
      }
    };
    if (provider) fetchGasEstimate();
  }, [provider]);

  // Handle price conversion
  useEffect(() => {
    let timeout;
    const convertPrice = async () => {
      setIsConverting(true);
      try {
        if (useUsd && usdPrice) {
          const { ethAmount } = await convertUsdToEth(usdPrice);
          setEthPrice(ethAmount);
        } else if (!useUsd && ethPrice) {
          const ethPriceInUsd = await getEthPriceInUsd();
          setUsdPrice((Number(ethPrice) * ethPriceInUsd).toFixed(2));
        } else {
          setEthPrice('');
          setUsdPrice('');
        }
      } catch (error) {
        console.error('CreateNftForm: Conversion error:', error);
        setEthPrice('');
        toast.error('USD to ETH conversion failed. Please use ETH price.', {
          id: 'convert-error'
        });
      } finally {
        setIsConverting(false);
      }
    };
    timeout = setTimeout(convertPrice, 500);
    return () => clearTimeout(timeout);
  }, [useUsd, usdPrice, ethPrice]);

  async function onSubmit(data) {
    if (useUsd && !ethPrice) {
      toast.error(
        'Cannot submit: USD to ETH conversion failed. Please use ETH price or try again.',
        { id: 'submit-error' }
      );
      return;
    }
    const image = typeof data.image === 'string' ? data.image : data.image[0];
    const priceField = useUsd ? ethPrice : ethPrice || data.purchasePrice;

    try {
      console.log('CreateNftForm: Submitting with priceField:', priceField);
      if (isEditSession) {
        await editNft(
          {
            newNftData: { ...data, purchasePrice: priceField },
            id: editId,
            contractAddress: editContractAddress || contracts?.doArt?.address
          },
          {
            onSuccess: () => {
              reset();
              onCloseModal?.();
              toast.success(`NFT updated for $${usdPrice} (~${ethPrice} ETH)`);
            }
          }
        );
      } else {
        await createNft(
          {
            ...data,
            image,
            purchasePrice: priceField,
            isUsd: useUsd,
            royaltyBps: data.royaltyBps || 500
          },
          {
            onSuccess: () => {
              reset();
              onCloseModal?.();
              toast.success(`NFT minted for $${usdPrice} (~${ethPrice} ETH)`);
            },
            onError: (err) => toast.error(`Failed to mint NFT: ${err.message}`)
          }
        );
      }
    } catch (err) {
      console.error('CreateNftForm: Transaction error:', err);
      toast.error(`Transaction failed: ${err.message}`);
    }
  }

  return (
    <div>
      {isLoading && <Spinner />}
      {web3Error && (
        <p style={{ color: 'red', textAlign: 'center' }}>
          Web3 Error: {web3Error}
        </p>
      )}
      {!isLoading && !web3Error && !account && (
        <p style={{ color: 'red', textAlign: 'center' }}>
          Please connect your wallet to mint NFTs.
        </p>
      )}
      {!isLoading &&
        !web3Error &&
        account &&
        (!contracts?.doArt || !contracts?.escrowListings) && (
          <p style={{ color: 'red', textAlign: 'center' }}>
            Contracts not initialized. Please try again.
          </p>
        )}
      {!isLoading &&
        !web3Error &&
        account &&
        contracts?.doArt &&
        contracts?.escrowListings && (
          <StyledForm
            onSubmit={handleSubmit(onSubmit)}
            type={onCloseModal ? 'modal' : 'regular'}
          >
            <FormRow label="NFT Title" error={errors?.title?.message}>
              <Tooltip text="The name of your NFT, displayed in the marketplace.">
                <Input
                  type="text"
                  id="title"
                  disabled={isWorking || isConverting}
                  {...register('title', { required: 'This field is required' })}
                  placeholder="Enter NFT title"
                />
              </Tooltip>
            </FormRow>
            <FormRow label="Price Currency">
              <Tooltip text="Choose whether to set the price in USD or ETH. USD prices are converted to ETH using real-time rates.">
                <label>
                  <input
                    type="checkbox"
                    checked={useUsd}
                    onChange={() => setUseUsd(!useUsd)}
                    disabled={isWorking || isConverting}
                  />
                  Use USD (uncheck for ETH)
                </label>
              </Tooltip>
            </FormRow>
            <FormRow
              label={useUsd ? 'Purchase Price (USD)' : 'Purchase Price (ETH)'}
              error={errors?.purchasePrice?.message}
            >
              <Tooltip
                text={
                  useUsd
                    ? 'Enter the price in USD. It will be converted to ETH for the blockchain.'
                    : 'Enter the price in ETH.'
                }
              >
                <Input
                  type="number"
                  step={useUsd ? '0.01' : '0.0001'}
                  id="purchasePrice"
                  disabled={isWorking || isConverting}
                  value={useUsd ? usdPrice : ethPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log(
                      `CreateNftForm: price input changed, value=${value}, useUsd=${useUsd}`
                    );
                    if (useUsd) setUsdPrice(value);
                    else setEthPrice(value);
                    setValue('purchasePrice', value, { shouldValidate: true });
                  }}
                  placeholder={useUsd ? 'Enter USD amount' : 'Enter ETH amount'}
                />
              </Tooltip>
            </FormRow>
            <FormRow label={useUsd ? 'Equivalent in ETH' : 'Equivalent in USD'}>
              <Input
                type="text"
                disabled
                value={
                  isConverting
                    ? 'Converting...'
                    : useUsd
                      ? `${ethPrice || 'N/A'} ETH`
                      : `$${usdPrice || 'N/A'}`
                }
              />
            </FormRow>
            <FormRow label="Estimated Gas Cost">
              <Tooltip text="Estimated cost of the blockchain transaction, paid in ETH. Actual cost may vary based on network conditions.">
                <Input type="text" disabled value={`$${gasEstimate}`} />
              </Tooltip>
            </FormRow>
            <FormRow label="Description" error={errors?.description?.message}>
              <Tooltip text="A brief description of your NFT, visible to buyers.">
                <Textarea
                  id="description"
                  disabled={isWorking || isConverting}
                  {...register('description', {
                    required: 'This field is required'
                  })}
                  placeholder="Enter NFT description"
                />
              </Tooltip>
            </FormRow>
            <FormRow label="Royalty (bps)" error={errors?.royaltyBps?.message}>
              <Tooltip text="Royalty percentage (in basis points, 100 bps = 1%) you earn on future sales. Can be updated later.">
                <Input
                  type="number"
                  id="royaltyBps"
                  disabled={isWorking || isConverting}
                  placeholder="Enter royalty in bps (e.g., 500 for 5%)"
                  {...register('royaltyBps', {
                    required: 'This field is required',
                    validate: (value) =>
                      Number(value) >= 0 || 'Royalty cannot be negative'
                  })}
                />
              </Tooltip>
            </FormRow>
            <FormRow label="NFT Image" error={errors?.image?.message}>
              <Tooltip text="Upload an image for your NFT (JPEG, PNG, etc.).">
                <FileInput
                  id="image"
                  accept="image/*"
                  disabled={isWorking || isConverting}
                  {...register('image', {
                    required: isEditSession ? false : 'This field is required'
                  })}
                />
              </Tooltip>
            </FormRow>
            <FormRow>
              <Button
                variation="secondary"
                type="reset"
                onClick={() => onCloseModal?.()}
                disabled={isWorking || isConverting}
              >
                Cancel
              </Button>
              <Button disabled={isWorking || isConverting}>
                {isWorking ? (
                  <Spinner />
                ) : isEditSession ? (
                  'Update Listing'
                ) : (
                  'Mint NFT'
                )}
              </Button>
            </FormRow>
          </StyledForm>
        )}
    </div>
  );
}

export default CreateNftForm;
