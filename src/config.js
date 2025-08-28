const config = {
  [import.meta.env.VITE_CHAIN_ID]: {
    doArt: { address: import.meta.env.VITE_DOART_ADDRESS },
    escrowStorage: { address: import.meta.env.VITE_ESCROW_STORAGE_ADDRESS },
    escrowListings: { address: import.meta.env.VITE_ESCROW_LISTINGS_ADDRESS },
    escrowAuctions: { address: import.meta.env.VITE_ESCROW_AUCTIONS_ADDRESS },
    escrowLazyMinting: {
      address: import.meta.env.VITE_ESCROW_LAZY_MINTING_ADDRESS
    }
  }
  /* My latest code is testing with Holesky testnet whose chain id is 17000, if you're using hardhat update the chain id to 31337 together with the relevant addresses in your .env*/
};

export default config;
