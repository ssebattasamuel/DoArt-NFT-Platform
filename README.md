# DoArt NFT Platform

A decentralized NFT platform built with Solidity, JavaScript, and Supabase. Features include minting, batch minting, burning, artist metadata, and a hybrid Escrow contract supporting private and open sales.

## Features

- **NFT Minting**: Create ERC721 NFTs with metadata stored on IPFS.
- **Royalties**: EIP-2981 compliant, ensuring creators get paid on secondary sales.
- **Batch Minting**: Mint multiple NFTs in one transaction.
- **Auctions**: English auctions with anti-sniping protection.
- **Bidding**: Place bids on open listings or auctions.
- **Lazy Minting**: List NFTs without upfront gas costs, minted on purchase.
- **Batch Bidding**: Bid on multiple NFTs or auctions in one transaction.
- **Escrow**: Secure trading with deposits and approval periods.
- **Supabase Integration**: Store NFT metadata and user profiles.

## Setup

1. Clone: "git clone https://github.com/ssebattasamuel/DoArt-NFT-Platform"
2. Install:"npm install"
3. Configure: `.env` with Supabase and Ethereum keys.
4. Compile: "npx hardhat compile"
5. Run: "npmrun dev"
6. Run node: `npx hardhat node`
7. Deploy: `npx hardhat run scripts/deploy.cjs --network localhost`
8. Start front-end: `npm run dev`
