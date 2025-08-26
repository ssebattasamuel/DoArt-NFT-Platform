# DoArt NFT Platform

A decentralized NFT marketplace built for artists and collectors, enabling seamless creation, trading, and management of digital art. Powered by Ethereum smart contracts, this platform supports private/open sales, auctions, bidding, royalties, lazy minting, and more. The frontend is a responsive React app integrated with Ethers.js for blockchain interactions and Pinata for IPFS storage.

As the creator of this project, I designed DoArt to provide a secure, efficient, and user-friendly experience for NFT enthusiasts. It leverages modern web3 technologies to ensure low-gas operations and real-time updates.

## Features

- **NFT Minting**: Create ERC721 NFTs with metadata stored on IPFS. Supports single minting (temporarily disabled for optimization) and batch minting up to 50 NFTs in one transaction.
- **Batch Operations**: Mint, list, bid, or auction bid multiple NFTs efficiently. For minting, optionally list for sale or set as auction immediately after creation.
- **Royalties**: EIP-2981 compliant royalties on secondary sales, configurable per NFT (e.g., 5% = 500 bps).
- **Auctions**: English-style auctions with anti-sniping (extends time on last-minute bids) and min increments.
- **Bidding**: Place bids on listings or auctions; supports batch bidding.
- **Lazy Minting**: Create vouchers for off-chain NFTs, minted on purchase to save gas.
- **Escrow System**: Secure deposits for private sales with approval periods.
- **Supabase Integration**: Backend for metadata and user profiles (artist bio, portfolio).
- **Admin Controls**: Pause/unpause contracts for maintenance.
- **Real-Time Pricing**: USD/ETH conversion for prices using CoinGecko API.
- **Responsive UI**: Mobile-friendly dashboard, gallery, trades, account, and settings pages.

## Tech Stack

- **Blockchain**: Solidity (smart contracts), Hardhat (development/testing/deployment), Ethers.js (web3 integration).
- **Frontend**: React, Tanstack Query (data fetching/caching), Styled Components (UI), React Hook Form (forms), React Hot Toast (notifications).
- **Storage**: Pinata/IPFS for NFT metadata and images.
- **Database**: Supabase for off-chain data (configure via .env).
- **Other**: Vite (build tool), React Router (navigation), Date-fns (dates), Axios (API calls).

## Prerequisites

- Node.js v18+ and npm
- MetaMask wallet (for testing on local Hardhat network)
- Pinata account (for IPFS): Get API key and secret from [pinata.cloud](https://pinata.cloud)
- Supabase project (optional for metadata): Get URL and key from [supabase.com](https://supabase.com)
- CoinGecko API (free, no key needed for price fetches)

## Installation

1. **Clone the Repository**:

   ```
   git clone https://github.com/ssebattasamuel/DoArt-NFT-Platform.git
   cd DoArt-NFT-Platform
   ```

2. **Install Dependencies**:

   ```
   npm install
   ```

3. **Configure Environment**:

   - Copy `.env.example` to `.env` and fill in:
     - `VITE_CHAIN_ID=31337` (local Hardhat)
     - `VITE_PINATA_API_KEY=your_pinata_key`
     - `VITE_PINATA_SECRET_KEY=your_pinata_secret`
     - `VITE_SUPABASE_URL=your_supabase_url` (optional)
     - `VITE_SUPABASE_KEY=your_supabase_key` (optional)
     - Contract addresses (after deployment)

4. **Start Hardhat Node**:

   ```
   npx hardhat node
   ```

   - This starts a local Ethereum node at `http://127.0.0.1:8545` with test accounts.

5. **Deploy Contracts**:

   ```
   npx hardhat run scripts/deploy.cjs --network localhost
   ```

   - Copy deployed addresses to `.env` (e.g., `VITE_DOART_ADDRESS=0x...`).
   - Grant roles if needed (admin, minter, etc.) via Hardhat console or scripts.

6. **Start Frontend**:
   ```
   npm run dev
   ```
   - Open `http://localhost:5173` in your browser.
   - Connect MetaMask to Hardhat network (Chain ID: 31337, RPC: http://127.0.0.1:8545).

## Usage

1. **Connect Wallet**: Use MetaMask to connect to the local network. Import a test account from Hardhat logs.

2. **Batch Mint NFTs** (Trades Page):

   - Click "Batch Mint".
   - Add items: Title, description, image, royalty, price (USD/ETH).
   - Tick "List for Sale" to auto-list after mint.
   - If listed, tick "Auction" and set min bid/duration.
   - Submit – mints in one tx, lists selected ones immediately.

3. **Batch List/Bid/Auction Bid** (Trades Page):

   - Similar form: Enter token IDs, prices/amounts.
   - For list: Option for auction with min bid/duration.

4. **Lazy Minting** (Trades Page):

   - Click "Create Lazy Mint".
   - Fill form – creates voucher stored in localStorage.
   - To redeem: (Implement if needed; currently vouchers are saved for manual use).

5. **Gallery**: View all NFTs, filter by listed/auctions, search by name.

6. **Account**: Update profile, view owned NFTs/listings/bids.

7. **Settings**: Pause/unpause contracts (admin only).

## Testing

- Run smart contract tests:
  ```
  npx hardhat test
  ```
- Manual: Mint batch (some listed/auctioned), bid, accept/end auction, burn, etc.
- Edge Cases: Max batch (50), invalid inputs, low balance.

## Contributing

Fork the repo, create a branch, commit changes, and submit a PR. Follow code style (Prettier/ESLint).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Built with ❤️ by [ssebattasamuel](https://github.com/ssebattasamuel). Contributions welcome! If you find issues, open a ticket.
