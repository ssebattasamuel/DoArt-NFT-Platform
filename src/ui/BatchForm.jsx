// import { useForm, useFieldArray } from 'react-hook-form';
// import { useState, useEffect } from 'react';
// import styled from 'styled-components';
// import Button from './Button';
// import Form from './Form';
// import FormRow from './FormRow';
// import Input from './Input';
// import FileInput from './FileInput';
// import Textarea from './Textarea';
// import Heading from './Heading';
// import Spinner from './Spinner';
// import Tooltip from './Tooltip';
// import { useBatchMint } from '../hooks/useBatchMint';
// import { useWeb3Context } from '../context/Web3Context.jsx';
// import { toast } from 'react-hot-toast';
// import { convertUsdToEth, estimateGasCostInUsd } from '../utils/priceConverter';
// import { ethers } from 'ethers';

// const StyledBatchForm = styled(Form)`
//   max-width: 800px;
//   padding: 2rem;
//   border-radius: var(--border-radius-md);
//   background-color: var(--color-grey-50);
//   max-height: 80vh;
//   overflow-y: auto;
//   display: flex;
//   flex-direction: column;
//   min-height: 50vh;
//   @media (max-width: 600px) {
//     padding: 1.5rem;
//   }
// `;

// const ItemContainer = styled.div`
//   border: 1px solid var(--color-grey-200);
//   padding: 1.5rem;
//   margin-bottom: 1.5rem;
//   border-radius: var(--border-radius-sm);
//   background-color: var(--color-grey-0);
// `;

// const FormFooter = styled.div`
//   position: sticky;
//   bottom: 0;
//   background: var(--color-grey-0);
//   padding: 1rem;
//   border-top: 1px solid var(--color-grey-200);
//   display: flex;
//   gap: 1rem;
//   justify-content: flex-end;
// `;

// const RemoveButton = styled(Button)`
//   margin-left: auto;
//   font-size: 1.2rem;
// `;

// function BatchForm({ type, onCloseModal }) {
//   const {
//     register,
//     control,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     setValue,
//     watch
//   } = useForm({
//     defaultValues: { items: [{}] }
//   });
//   const { fields, append, remove } = useFieldArray({ control, name: 'items' });
//   const { batchMint, isMinting } = useBatchMint();
//   const {
//     account,
//     error: web3Error,
//     isLoading,
//     provider,
//     contracts
//   } = useWeb3Context();
//   const [useUsd, setUseUsd] = useState(true);
//   const [gasEstimate, setGasEstimate] = useState('Calculating...');
//   const [priceInputs, setPriceInputs] = useState(
//     fields.map(() => ({ usd: '', eth: '' }))
//   );
//   const [isConverting, setIsConverting] = useState(false);
//   const isMint = type === 'mint';
//   const isList = type === 'list';
//   const isBid = type === 'bid' || type === 'auctionBid';
//   const watchedItems = watch('items');

//   // Validate prices with debounce
//   useEffect(() => {
//     let timeout;
//     const validatePrices = () => {
//       watchedItems.forEach((item, index) => {
//         const price = item.purchasePrice;
//         console.log(
//           `BatchForm: Validating price for item ${index}, value=${price}`
//         );
//         if (price && Number(price) <= 0) {
//           toast.error(`Price for item ${index + 1} must be positive`, {
//             id: `price-error-${index}`
//           });
//         }
//       });
//     };
//     if (watchedItems.some((item) => item.purchasePrice)) {
//       timeout = setTimeout(validatePrices, 500);
//     }
//     return () => clearTimeout(timeout);
//   }, [watchedItems]);

//   // Estimate gas cost
//   useEffect(() => {
//     const fetchGasEstimate = async () => {
//       try {
//         const gasLimit = ethers.BigNumber.from('200000').mul(fields.length);
//         const gasCost = await estimateGasCostInUsd(gasLimit, provider);
//         setGasEstimate(gasCost);
//       } catch (error) {
//         setGasEstimate('N/A');
//       }
//     };
//     if (provider) fetchGasEstimate();
//   }, [provider, fields.length]);

//   // Sync priceInputs with fields
//   useEffect(() => {
//     setPriceInputs((prev) =>
//       fields.map((_, index) => prev[index] || { usd: '', eth: '' })
//     );
//   }, [fields]);

//   // Handle price conversion
//   useEffect(() => {
//     let timeout;
//     const convertPrices = async () => {
//       setIsConverting(true);
//       try {
//         const updatedPrices = await Promise.all(
//           priceInputs.map(async (price, index) => {
//             try {
//               if (useUsd && price.usd) {
//                 const { ethAmount } = await convertUsdToEth(price.usd);
//                 return { usd: price.usd, eth: ethAmount };
//               } else if (!useUsd && price.eth) {
//                 const ethPriceInUsd = await getEthPriceInUsd();
//                 return {
//                   usd: (Number(price.eth) * ethPriceInUsd).toFixed(2),
//                   eth: price.eth
//                 };
//               }
//               return price;
//             } catch (error) {
//               toast.error(`Failed to convert price for item ${index + 1}`, {
//                 id: `convert-error-${index}`
//               });
//               return price;
//             }
//           })
//         );
//         setPriceInputs(updatedPrices);
//       } finally {
//         setIsConverting(false);
//       }
//     };
//     timeout = setTimeout(convertPrices, 500);
//     return () => clearTimeout(timeout);
//   }, [useUsd, priceInputs]);

//   const handlePriceChange = (index, value) => {
//     console.log(
//       `BatchForm: handlePriceChange index=${index}, value=${value}, useUsd=${useUsd}`
//     );
//     setPriceInputs((prev) => {
//       const newPriceInputs = [...prev];
//       newPriceInputs[index] = {
//         ...newPriceInputs[index],
//         [useUsd ? 'usd' : 'eth']: value
//       };
//       return newPriceInputs;
//     });
//     setValue(`items.${index}.purchasePrice`, value, { shouldValidate: true });
//   };

//   const onSubmit = async (data) => {
//     if (isMint) {
//       try {
//         const formattedData = await Promise.all(
//           data.items.map(async (item, index) => {
//             const priceField = useUsd
//               ? priceInputs[index].usd
//               : priceInputs[index].eth;
//             return {
//               title: item.title,
//               description: item.description,
//               image: item.image?.[0],
//               royaltyBps: item.royaltyBps || 500,
//               purchasePrice: priceField,
//               isUsd: useUsd
//             };
//           })
//         );
//         console.log('Submitting batch data:', formattedData);
//         await batchMint(formattedData, {
//           onSuccess: () => {
//             toast.success(`Batch minted ${formattedData.length} NFTs`);
//             reset();
//             onCloseModal?.();
//           },
//           onError: (err) => toast.error(`Failed to mint NFTs: ${err.message}`)
//         });
//       } catch (err) {
//         console.error('Batch form submission error:', err);
//         toast.error(`Failed to mint NFTs: ${err.message}`);
//       }
//     }
//   };

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
//           Please connect your wallet to batch mint NFTs.
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
//           <StyledBatchForm onSubmit={handleSubmit(onSubmit)} type="modal">
//             <Heading as="h3">
//               {type === 'mint'
//                 ? 'Batch Mint NFTs'
//                 : type === 'list'
//                   ? 'Batch List NFTs'
//                   : type === 'bid'
//                     ? 'Batch Place Bids'
//                     : 'Batch Place Auction Bids'}
//             </Heading>
//             <FormRow label="Price Currency">
//               <Tooltip text="Choose whether to set prices in USD or ETH. USD prices are converted to ETH using real-time rates.">
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={useUsd}
//                     onChange={() => setUseUsd(!useUsd)}
//                     disabled={isMinting || isConverting}
//                   />
//                   Use USD (uncheck for ETH)
//                 </label>
//               </Tooltip>
//             </FormRow>
//             <FormRow label="Estimated Gas Cost">
//               <Tooltip text="Estimated cost of the blockchain transactions, paid in ETH. Actual cost may vary based on network conditions.">
//                 <Input type="text" disabled value={`$${gasEstimate}`} />
//               </Tooltip>
//             </FormRow>
//             {fields.map((field, index) => (
//               <ItemContainer key={field.id}>
//                 <FormRow
//                   label={
//                     isMint ? 'NFT Title' : isList ? 'Token ID' : 'Token ID'
//                   }
//                   error={
//                     errors.items?.[index]?.title?.message ||
//                     errors.items?.[index]?.tokenId?.message
//                   }
//                 >
//                   <Tooltip
//                     text={
//                       isMint
//                         ? 'The name of your NFT.'
//                         : 'The unique ID of the NFT.'
//                     }
//                   >
//                     <Input
//                       type={isMint ? 'text' : 'number'}
//                       disabled={isMinting || isConverting}
//                       {...register(
//                         `items.${index}.${isMint ? 'title' : 'tokenId'}`,
//                         {
//                           required: 'This field is required'
//                         }
//                       )}
//                       placeholder={
//                         isMint ? 'Enter NFT title' : 'Enter token ID'
//                       }
//                     />
//                   </Tooltip>
//                 </FormRow>
//                 {isMint && (
//                   <>
//                     <FormRow
//                       label="Description"
//                       error={errors.items?.[index]?.description?.message}
//                     >
//                       <Tooltip text="A brief description of your NFT, visible to buyers.">
//                         <Textarea
//                           disabled={isMinting || isConverting}
//                           {...register(`items.${index}.description`, {
//                             required: 'This field is required'
//                           })}
//                           placeholder="Enter NFT description"
//                         />
//                       </Tooltip>
//                     </FormRow>
//                     <FormRow
//                       label="Royalty (bps)"
//                       error={errors.items?.[index]?.royaltyBps?.message}
//                     >
//                       <Tooltip text="Royalty percentage (in basis points, 100 bps = 1%) you earn on future sales. Can be updated later.">
//                         <Input
//                           type="number"
//                           disabled={isMinting || isConverting}
//                           {...register(`items.${index}.royaltyBps`, {
//                             required: 'This field is required',
//                             validate: (value) =>
//                               Number(value) >= 0 || 'Royalty cannot be negative'
//                           })}
//                           placeholder="Enter royalty in bps (e.g., 500 for 5%)"
//                         />
//                       </Tooltip>
//                     </FormRow>
//                     <FormRow
//                       label={
//                         useUsd ? 'Purchase Price (USD)' : 'Purchase Price (ETH)'
//                       }
//                       error={errors.items?.[index]?.purchasePrice?.message}
//                     >
//                       <Tooltip
//                         text={
//                           useUsd
//                             ? 'Enter the price in USD. It will be converted to ETH.'
//                             : 'Enter the price in ETH.'
//                         }
//                       >
//                         <Input
//                           type="number"
//                           step={useUsd ? '0.01' : '0.0001'}
//                           disabled={isMinting || isConverting}
//                           value={
//                             useUsd
//                               ? priceInputs[index]?.usd || ''
//                               : priceInputs[index]?.eth || ''
//                           }
//                           onChange={(e) =>
//                             handlePriceChange(index, e.target.value)
//                           }
//                           placeholder={
//                             useUsd ? 'Enter USD amount' : 'Enter ETH amount'
//                           }
//                         />
//                       </Tooltip>
//                     </FormRow>
//                     <FormRow
//                       label={useUsd ? 'Equivalent in ETH' : 'Equivalent in USD'}
//                     >
//                       <Input
//                         type="text"
//                         disabled
//                         value={
//                           isConverting
//                             ? 'Converting...'
//                             : useUsd
//                               ? `${priceInputs[index]?.eth || ''} ETH`
//                               : `$${priceInputs[index]?.usd || ''}`
//                         }
//                       />
//                     </FormRow>
//                     <FormRow
//                       label="Image"
//                       error={errors.items?.[index]?.image?.message}
//                     >
//                       <Tooltip text="Upload an image for your NFT (JPEG, PNG, etc.).">
//                         <FileInput
//                           disabled={isMinting || isConverting}
//                           {...register(`items.${index}.image`, {
//                             required: 'This field is required'
//                           })}
//                           accept="image/*"
//                           type="file"
//                         />
//                       </Tooltip>
//                     </FormRow>
//                   </>
//                 )}
//                 {(isList || isBid) && (
//                   <FormRow
//                     label={isList ? 'Price (ETH)' : 'Bid Amount (ETH)'}
//                     error={
//                       errors.items?.[index]?.price?.message ||
//                       errors.items?.[index]?.amount?.message
//                     }
//                   >
//                     <Tooltip
//                       text={
//                         isList
//                           ? 'Set the listing price in ETH.'
//                           : 'Set the bid amount in ETH.'
//                       }
//                     >
//                       <Input
//                         type="number"
//                         step="0.01"
//                         disabled={isMinting || isConverting}
//                         {...register(
//                           `items.${index}.${isList ? 'price' : 'amount'}`,
//                           {
//                             required: 'This field is required',
//                             validate: (v) =>
//                               Number(v) > 0 || 'Value must be positive'
//                           }
//                         )}
//                         placeholder={
//                           isList
//                             ? 'Enter price in ETH'
//                             : 'Enter bid amount in ETH'
//                         }
//                       />
//                     </Tooltip>
//                   </FormRow>
//                 )}
//                 {isList && (
//                   <>
//                     <FormRow
//                       label="Minimum Bid (ETH)"
//                       error={errors.items?.[index]?.minBid?.message}
//                     >
//                       <Tooltip text="Minimum bid amount for auctions (in ETH).">
//                         <Input
//                           type="number"
//                           step="0.01"
//                           disabled={isMinting || isConverting}
//                           {...register(`items.${index}.minBid`, {
//                             required: 'This field is required'
//                           })}
//                           placeholder="Enter minimum bid in ETH"
//                         />
//                       </Tooltip>
//                     </FormRow>
//                     <FormRow label="Auction">
//                       <Tooltip text="Check to list this NFT as an auction.">
//                         <Input
//                           type="checkbox"
//                           disabled={isMinting || isConverting}
//                           {...register(`items.${index}.isAuction`)}
//                         />
//                       </Tooltip>
//                     </FormRow>
//                     {field.isAuction && (
//                       <FormRow
//                         label="Auction Duration (hours)"
//                         error={errors.items?.[index]?.auctionDuration?.message}
//                       >
//                         <Tooltip text="Duration of the auction in hours.">
//                           <Input
//                             type="number"
//                             disabled={isMinting || isConverting}
//                             {...register(`items.${index}.auctionDuration`, {
//                               required: 'Required for auctions'
//                             })}
//                             placeholder="Enter auction duration in hours"
//                           />
//                         </Tooltip>
//                       </FormRow>
//                     )}
//                   </>
//                 )}
//                 <RemoveButton
//                   variation="danger"
//                   size="small"
//                   onClick={() => {
//                     remove(index);
//                     setPriceInputs((prev) =>
//                       prev.filter((_, i) => i !== index)
//                     );
//                   }}
//                   disabled={isMinting || isConverting}
//                 >
//                   Remove
//                 </RemoveButton>
//               </ItemContainer>
//             ))}
//             <FormFooter>
//               <Button
//                 type="button"
//                 variation="secondary"
//                 onClick={() => {
//                   append({});
//                   setPriceInputs((prev) => [...prev, { usd: '', eth: '' }]);
//                 }}
//                 disabled={isMinting || isConverting}
//               >
//                 Add Item
//               </Button>
//               <Button type="submit" disabled={isMinting || isConverting}>
//                 {isMinting ? <Spinner /> : 'Submit'}
//               </Button>
//               <Button
//                 type="button"
//                 variation="secondary"
//                 onClick={() => onCloseModal?.()}
//                 disabled={isMinting || isConverting}
//               >
//                 Cancel
//               </Button>
//             </FormFooter>
//           </StyledBatchForm>
//         )}
//     </div>
//   );
// }

// export default BatchForm;

import { useForm, useFieldArray } from 'react-hook-form';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Button from './Button';
import Form from './Form';
import FormRow from './FormRow';
import Input from './Input';
import FileInput from './FileInput';
import Textarea from './Textarea';
import Heading from './Heading';
import Spinner from './Spinner';
import Tooltip from './Tooltip';
import { useBatchMint } from '../hooks/useBatchMint';
import { useWeb3Context } from '../context/Web3Context.jsx';
import { toast } from 'react-hot-toast';
import { convertUsdToEth, estimateGasCostInUsd } from '../utils/priceConverter';
import { ethers } from 'ethers';

const StyledBatchForm = styled(Form)`
  max-width: 800px;
  padding: 2rem;
  border-radius: var(--border-radius-md);
  background-color: var(--color-grey-50);
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  min-height: 50vh;
  @media (max-width: 600px) {
    padding: 1.5rem;
  }
`;

const ItemContainer = styled.div`
  border: 1px solid var(--color-grey-200);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: var(--border-radius-sm);
  background-color: var(--color-grey-0);
`;

const FormFooter = styled.div`
  position: sticky;
  bottom: 0;
  background: var(--color-grey-0);
  padding: 1rem;
  border-top: 1px solid var(--color-grey-200);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const RemoveButton = styled(Button)`
  margin-left: auto;
  font-size: 1.2rem;
`;

function BatchForm({ type, onCloseModal }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: { items: [{}] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const { batchMint, isMinting } = useBatchMint();
  const {
    account,
    error: web3Error,
    isLoading,
    provider,
    contracts
  } = useWeb3Context();
  const [useUsd, setUseUsd] = useState(true);
  const [gasEstimate, setGasEstimate] = useState('Calculating...');
  const [priceInputs, setPriceInputs] = useState(
    fields.map(() => ({ usd: '', eth: '' }))
  );
  const [isConverting, setIsConverting] = useState(false);
  const isMint = type === 'mint';
  const isList = type === 'list';
  const isBid = type === 'bid' || type === 'auctionBid';
  const watchedItems = watch('items');

  // Validate prices with debounce
  useEffect(() => {
    let timeout;
    const validatePrices = () => {
      watchedItems.forEach((item, index) => {
        const price = item.purchasePrice;
        console.log(
          `BatchForm: Validating price for item ${index}, value=${price}`
        );
        if (price && Number(price) <= 0) {
          toast.error(`Price for item ${index + 1} must be positive`, {
            id: `price-error-${index}`
          });
        }
      });
    };
    if (watchedItems.some((item) => item.purchasePrice)) {
      timeout = setTimeout(validatePrices, 500);
    }
    return () => clearTimeout(timeout);
  }, [watchedItems]);

  // Estimate gas cost
  useEffect(() => {
    const fetchGasEstimate = async () => {
      try {
        const gasLimit = ethers.BigNumber.from('200000').mul(fields.length);
        const gasCost = await estimateGasCostInUsd(gasLimit, provider);
        setGasEstimate(gasCost);
      } catch (error) {
        setGasEstimate('N/A');
      }
    };
    if (provider) fetchGasEstimate();
  }, [provider, fields.length]);

  // Sync priceInputs with fields
  useEffect(() => {
    setPriceInputs((prev) =>
      fields.map((_, index) => prev[index] || { usd: '', eth: '' })
    );
  }, [fields]);

  // Handle price conversion
  useEffect(() => {
    let timeout;
    const convertPrices = async () => {
      setIsConverting(true);
      try {
        const updatedPrices = await Promise.all(
          priceInputs.map(async (price, index) => {
            try {
              if (useUsd && price.usd) {
                const { ethAmount } = await convertUsdToEth(price.usd);
                return { usd: price.usd, eth: ethAmount };
              } else if (!useUsd && price.eth) {
                const ethPriceInUsd = await getEthPriceInUsd();
                return {
                  usd: (Number(price.eth) * ethPriceInUsd).toFixed(2),
                  eth: price.eth
                };
              }
              return price;
            } catch (error) {
              console.error(
                `BatchForm: Conversion error for item ${index}:`,
                error
              );
              return { usd: price.usd, eth: '' };
            }
          })
        );
        setPriceInputs(updatedPrices);
      } finally {
        setIsConverting(false);
      }
    };
    timeout = setTimeout(convertPrices, 500);
    return () => clearTimeout(timeout);
  }, [useUsd, priceInputs]);

  const handlePriceChange = (index, value) => {
    console.log(
      `BatchForm: handlePriceChange index=${index}, value=${value}, useUsd=${useUsd}`
    );
    setPriceInputs((prev) => {
      const newPriceInputs = [...prev];
      newPriceInputs[index] = {
        ...newPriceInputs[index],
        [useUsd ? 'usd' : 'eth']: value
      };
      return newPriceInputs;
    });
    setValue(`items.${index}.purchasePrice`, value, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    if (isMint) {
      try {
        const formattedData = await Promise.all(
          data.items.map(async (item, index) => {
            const priceField = useUsd
              ? priceInputs[index].eth
              : priceInputs[index].eth || item.purchasePrice;
            if (useUsd && !priceInputs[index].eth) {
              throw new Error(
                `USD to ETH conversion failed for item ${index + 1}`
              );
            }
            return {
              title: item.title,
              description: item.description,
              image: item.image?.[0],
              royaltyBps: item.royaltyBps || 500,
              purchasePrice: priceField,
              isUsd: useUsd
            };
          })
        );
        console.log('BatchForm: Submitting batch data:', formattedData);
        await batchMint(formattedData, {
          onSuccess: () => {
            toast.success(`Batch minted ${formattedData.length} NFTs`);
            reset();
            onCloseModal?.();
          },
          onError: (err) => toast.error(`Failed to mint NFTs: ${err.message}`)
        });
      } catch (err) {
        console.error('BatchForm: Submission error:', err);
        toast.error(`Failed to mint NFTs: ${err.message}`);
      }
    }
  };

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
          Please connect your wallet to batch mint NFTs.
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
          <StyledBatchForm onSubmit={handleSubmit(onSubmit)} type="modal">
            <Heading as="h3">
              {type === 'mint'
                ? 'Batch Mint NFTs'
                : type === 'list'
                  ? 'Batch List NFTs'
                  : type === 'bid'
                    ? 'Batch Place Bids'
                    : 'Batch Place Auction Bids'}
            </Heading>
            <FormRow label="Price Currency">
              <Tooltip text="Choose whether to set prices in USD or ETH. USD prices are converted to ETH using real-time rates.">
                <label>
                  <input
                    type="checkbox"
                    checked={useUsd}
                    onChange={() => setUseUsd(!useUsd)}
                    disabled={isMinting || isConverting}
                  />
                  Use USD (uncheck for ETH)
                </label>
              </Tooltip>
            </FormRow>
            <FormRow label="Estimated Gas Cost">
              <Tooltip text="Estimated cost of the blockchain transactions, paid in ETH. Actual cost may vary based on network conditions.">
                <Input type="text" disabled value={`$${gasEstimate}`} />
              </Tooltip>
            </FormRow>
            {fields.map((field, index) => (
              <ItemContainer key={field.id}>
                <FormRow
                  label={
                    isMint ? 'NFT Title' : isList ? 'Token ID' : 'Token ID'
                  }
                  error={
                    errors.items?.[index]?.title?.message ||
                    errors.items?.[index]?.tokenId?.message
                  }
                >
                  <Tooltip
                    text={
                      isMint
                        ? 'The name of your NFT.'
                        : 'The unique ID of the NFT.'
                    }
                  >
                    <Input
                      type={isMint ? 'text' : 'number'}
                      disabled={isMinting || isConverting}
                      {...register(
                        `items.${index}.${isMint ? 'title' : 'tokenId'}`,
                        {
                          required: 'This field is required'
                        }
                      )}
                      placeholder={
                        isMint ? 'Enter NFT title' : 'Enter token ID'
                      }
                    />
                  </Tooltip>
                </FormRow>
                {isMint && (
                  <>
                    <FormRow
                      label="Description"
                      error={errors.items?.[index]?.description?.message}
                    >
                      <Tooltip text="A brief description of your NFT, visible to buyers.">
                        <Textarea
                          disabled={isMinting || isConverting}
                          {...register(`items.${index}.description`, {
                            required: 'This field is required'
                          })}
                          placeholder="Enter NFT description"
                        />
                      </Tooltip>
                    </FormRow>
                    <FormRow
                      label="Royalty (bps)"
                      error={errors.items?.[index]?.royaltyBps?.message}
                    >
                      <Tooltip text="Royalty percentage (in basis points, 100 bps = 1%) you earn on future sales. Can be updated later.">
                        <Input
                          type="number"
                          disabled={isMinting || isConverting}
                          {...register(`items.${index}.royaltyBps`, {
                            required: 'This field is required',
                            validate: (value) =>
                              Number(value) >= 0 || 'Royalty cannot be negative'
                          })}
                          placeholder="Enter royalty in bps (e.g., 500 for 5%)"
                        />
                      </Tooltip>
                    </FormRow>
                    <FormRow
                      label={
                        useUsd ? 'Purchase Price (USD)' : 'Purchase Price (ETH)'
                      }
                      error={errors.items?.[index]?.purchasePrice?.message}
                    >
                      <Tooltip
                        text={
                          useUsd
                            ? 'Enter the price in USD. It will be converted to ETH.'
                            : 'Enter the price in ETH.'
                        }
                      >
                        <Input
                          type="number"
                          step={useUsd ? '0.01' : '0.0001'}
                          disabled={isMinting || isConverting}
                          value={
                            useUsd
                              ? priceInputs[index]?.usd || ''
                              : priceInputs[index]?.eth || ''
                          }
                          onChange={(e) =>
                            handlePriceChange(index, e.target.value)
                          }
                          placeholder={
                            useUsd ? 'Enter USD amount' : 'Enter ETH amount'
                          }
                        />
                      </Tooltip>
                    </FormRow>
                    <FormRow
                      label={useUsd ? 'Equivalent in ETH' : 'Equivalent in USD'}
                    >
                      <Input
                        type="text"
                        disabled
                        value={
                          isConverting
                            ? 'Converting...'
                            : useUsd
                              ? `${priceInputs[index]?.eth || 'N/A'} ETH`
                              : `$${priceInputs[index]?.usd || 'N/A'}`
                        }
                      />
                    </FormRow>
                    <FormRow
                      label="Image"
                      error={errors.items?.[index]?.image?.message}
                    >
                      <Tooltip text="Upload an image for your NFT (JPEG, PNG, etc.).">
                        <FileInput
                          disabled={isMinting || isConverting}
                          {...register(`items.${index}.image`, {
                            required: 'This field is required'
                          })}
                          accept="image/*"
                          type="file"
                        />
                      </Tooltip>
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
                    <Tooltip
                      text={
                        isList
                          ? 'Set the listing price in ETH.'
                          : 'Set the bid amount in ETH.'
                      }
                    >
                      <Input
                        type="number"
                        step="0.01"
                        disabled={isMinting || isConverting}
                        {...register(
                          `items.${index}.${isList ? 'price' : 'amount'}`,
                          {
                            required: 'This field is required',
                            validate: (v) =>
                              Number(v) > 0 || 'Value must be positive'
                          }
                        )}
                        placeholder={
                          isList
                            ? 'Enter price in ETH'
                            : 'Enter bid amount in ETH'
                        }
                      />
                    </Tooltip>
                  </FormRow>
                )}
                {isList && (
                  <>
                    <FormRow
                      label="Minimum Bid (ETH)"
                      error={errors.items?.[index]?.minBid?.message}
                    >
                      <Tooltip text="Minimum bid amount for auctions (in ETH).">
                        <Input
                          type="number"
                          step="0.01"
                          disabled={isMinting || isConverting}
                          {...register(`items.${index}.minBid`, {
                            required: 'This field is required'
                          })}
                          placeholder="Enter minimum bid in ETH"
                        />
                      </Tooltip>
                    </FormRow>
                    <FormRow label="Auction">
                      <Tooltip text="Check to list this NFT as an auction.">
                        <Input
                          type="checkbox"
                          disabled={isMinting || isConverting}
                          {...register(`items.${index}.isAuction`)}
                        />
                      </Tooltip>
                    </FormRow>
                    {field.isAuction && (
                      <FormRow
                        label="Auction Duration (hours)"
                        error={errors.items?.[index]?.auctionDuration?.message}
                      >
                        <Tooltip text="Duration of the auction in hours.">
                          <Input
                            type="number"
                            disabled={isMinting || isConverting}
                            {...register(`items.${index}.auctionDuration`, {
                              required: 'Required for auctions'
                            })}
                            placeholder="Enter auction duration in hours"
                          />
                        </Tooltip>
                      </FormRow>
                    )}
                  </>
                )}
                <RemoveButton
                  variation="danger"
                  size="small"
                  onClick={() => {
                    remove(index);
                    setPriceInputs((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
                  }}
                  disabled={isMinting || isConverting}
                >
                  Remove
                </RemoveButton>
              </ItemContainer>
            ))}
            <FormFooter>
              <Button
                type="button"
                variation="secondary"
                onClick={() => {
                  append({});
                  setPriceInputs((prev) => [...prev, { usd: '', eth: '' }]);
                }}
                disabled={isMinting || isConverting}
              >
                Add Item
              </Button>
              <Button type="submit" disabled={isMinting || isConverting}>
                {isMinting ? <Spinner /> : 'Submit'}
              </Button>
              <Button
                type="button"
                variation="secondary"
                onClick={() => onCloseModal?.()}
                disabled={isMinting || isConverting}
              >
                Cancel
              </Button>
            </FormFooter>
          </StyledBatchForm>
        )}
    </div>
  );
}

export default BatchForm;
