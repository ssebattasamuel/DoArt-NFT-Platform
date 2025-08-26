import { useState } from 'react';
import styled from 'styled-components';
import Form from './Form';
import FormRow from './FormRow';
import Button from './Button';
import { useRedeemLazyMint } from '../hooks/useRedeemLazyMint';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';

const VoucherList = styled.ul`
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
`;

const VoucherItem = styled.li`
  padding: 1rem;
  border-bottom: 1px solid var(--color-grey-200);
  cursor: pointer;
  &:hover {
    background-color: var(--color-grey-100);
  }
`;

function RedeemLazyForm({ onCloseModal }) {
  const { redeem, isRedeeming } = useRedeemLazyMint();
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const vouchers = JSON.parse(localStorage.getItem('lazyVouchers') || '[]');

  const handleRedeem = () => {
    if (!selectedVoucher) {
      toast.error('Select a voucher to redeem');
      return;
    }
    redeem(selectedVoucher, {
      onSuccess: () => {
        const updatedVouchers = vouchers.filter(
          (v) => v.tokenId !== selectedVoucher.tokenId
        );
        localStorage.setItem('lazyVouchers', JSON.stringify(updatedVouchers));
        toast.success('Voucher redeemed successfully');
        onCloseModal?.();
      },
      onError: (err) => toast.error(`Failed to redeem: ${err.message}`)
    });
  };

  return (
    <Form type="modal">
      <FormRow label="Select Voucher to Redeem">
        <VoucherList>
          {vouchers.map((voucher) => (
            <VoucherItem
              key={voucher.tokenId}
              onClick={() => setSelectedVoucher(voucher)}
              style={{
                backgroundColor:
                  selectedVoucher?.tokenId === voucher.tokenId
                    ? 'var(--color-grey-200)'
                    : 'transparent'
              }}
            >
              Token #{voucher.tokenId} - Price:{' '}
              {ethers.utils.formatEther(voucher.price)} ETH
            </VoucherItem>
          ))}
          {vouchers.length === 0 && <p>No vouchers available</p>}
        </VoucherList>
      </FormRow>
      <FormRow>
        <Button
          variation="secondary"
          onClick={() => onCloseModal?.()}
          disabled={isRedeeming}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRedeem}
          disabled={isRedeeming || !selectedVoucher}
        >
          {isRedeeming ? 'Redeeming...' : 'Redeem Selected'}
        </Button>
      </FormRow>
    </Form>
  );
}

export default RedeemLazyForm;
