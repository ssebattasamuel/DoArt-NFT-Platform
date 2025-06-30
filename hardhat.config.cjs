require('@nomicfoundation/hardhat-toolbox');
require('hardhat-gas-reporter');

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
    hardhat: {
      chainId: 31337
    }
  }
};
