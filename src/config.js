const config = {
  [import.meta.env.VITE_CHAIN_ID]: {
    doArt: { address: import.meta.env.VITE_DOART_ADDRESS },
    escrowStorage: { address: import.meta.env.VITE_ESCROW_STORAGE_ADDRESS },
    escrowListings: { address: import.meta.env.VITE_ESCROW_LISTINGS_ADDRESS },
    escrowAuctions: { address: import.meta.env.VITE_ESCROW_AUCTIONS_ADDRESS },
    escrowLazyMinting: { address: import.meta.env.VITE_ESCROW_LAZY_MINTING_ADDRESS },
  },
};

export default config;
