# DoArt NFT Platform

A decentralized NFT platform built with Solidity, JavaScript, and Supabase. Features include minting, batch minting, burning, artist metadata, and a hybrid Escrow contract supporting private and open sales.

## Features

- **DoArt Contract**: Mint, burn, and manage NFTs with EIP-2981 royalties and artist metadata.
- **Escrow Contract**: Securely list, deposit, approve, and finalize NFT sales (private or open).
- **Front-End**: User-friendly interface for minting, listing, and purchasing NFTs.
- **Supabase Backend**: Stores NFT and artist metadata off-chain.
- **Tests**: Comprehensive Hardhat tests for all contract functionality.

## Setup

1. Clone: "git clone https://github.com/ssebattasamuel/DoArt-NFT-Platform"
2. Install:"npm install"
3. Configure: `.env` with Supabase and Ethereum keys.
4. Compile: "npx hardhat compile"
5. Run: "npmrun dev"
