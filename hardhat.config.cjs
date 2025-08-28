require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');
require('dotenv').config();

module.exports = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 20
  },
  networks: {
    hardhat: {},

    holesky: {
      url: process.env.VITE_HOLESKY_RPC_URL,
      accounts: [process.env.VITE_PRIVATE_KEY]
    }
  }
};
