// import axios from 'axios';
// import { ethers } from 'ethers';

// let cachedEthPrice = null;
// let cacheTimestamp = null;
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// export async function getEthPriceInUsd() {
//   // Check if cached price is still valid
//   if (
//     cachedEthPrice &&
//     cacheTimestamp &&
//     Date.now() - cacheTimestamp < CACHE_DURATION
//   ) {
//     console.log('Using cached ETH price:', cachedEthPrice);
//     return cachedEthPrice;
//   }

//   try {
//     const response = await axios.get(
//       'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
//     );
//     cachedEthPrice = response.data.ethereum.usd; // e.g., 2500 (USD per ETH)
//     cacheTimestamp = Date.now();
//     console.log('Fetched ETH price:', cachedEthPrice);
//     return cachedEthPrice;
//   } catch (error) {
//     console.error('Error fetching ETH price:', error.message);
//     throw new Error('Failed to fetch ETH price');
//   }
// }

// export async function convertUsdToEth(usdAmount) {
//   try {
//     const ethPriceInUsd = await getEthPriceInUsd();
//     const ethAmount = Number(usdAmount) / ethPriceInUsd; // e.g., 500 USD / 2500 USD/ETH = 0.2 ETH
//     const weiAmount = ethers.parseEther(ethAmount.toFixed(18)); // Convert to wei
//     return { ethAmount: ethAmount.toFixed(4), weiAmount };
//   } catch (error) {
//     console.error('Error converting USD to ETH:', error);
//     throw new Error('Failed to convert USD to ETH');
//   }
// }

// export async function estimateGasCostInUsd(gasLimit, provider) {
//   try {
//     const gasPrice = await provider.getGasPrice(); // Gas price in wei
//     const ethPriceInUsd = await getEthPriceInUsd();
//     const gasCostInWei = gasPrice.mul(gasLimit); // Total gas cost in wei
//     const gasCostInEth = ethers.utils.formatEther(gasCostInWei); // Convert to ETH
//     const gasCostInUsd = Number(gasCostInEth) * ethPriceInUsd; // Convert to USD
//     return gasCostInUsd.toFixed(2); // Return USD value rounded to 2 decimals
//   } catch (error) {
//     console.error('Error estimating gas cost:', error);
//     return 'N/A';
//   }
// }
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

let cachedEthPrice = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getEthPriceInUsd() {
  console.log('getEthPriceInUsd: Fetching ETH price');
  const now = Date.now();
  if (cachedEthPrice && now - lastFetchTime < CACHE_DURATION) {
    console.log('getEthPriceInUsd: Using cached ETH price:', cachedEthPrice);
    return cachedEthPrice;
  }

  try {
    // Replace with your preferred price API (e.g., CoinGecko)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    const data = await response.json();
    cachedEthPrice = data.ethereum.usd;
    lastFetchTime = now;
    console.log('getEthPriceInUsd: Fetched ETH price:', cachedEthPrice);
    return cachedEthPrice;
  } catch (error) {
    console.error('getEthPriceInUsd: Error fetching ETH price:', error);
    toast.error('Failed to fetch ETH price');
    if (cachedEthPrice) {
      console.log('getEthPriceInUsd: Using cached ETH price:', cachedEthPrice);
      return cachedEthPrice;
    }
    throw error;
  }
}

async function convertUsdToEth(usdAmount) {
  try {
    console.log('convertUsdToEth: Converting USD amount:', usdAmount);
    const ethPrice = await getEthPriceInUsd();
    const ethAmount = (Number(usdAmount) / ethPrice).toFixed(8);
    const weiAmount = ethers.utils.parseEther(ethAmount.toString());
    console.log(
      'convertUsdToEth: Converted to ETH:',
      ethAmount,
      'Wei:',
      weiAmount.toString()
    );
    return { ethAmount, weiAmount };
  } catch (error) {
    console.error('convertUsdToEth: Error converting USD to ETH:', error);
    toast.error('Error converting USD to ETH');
    throw error;
  }
}

async function estimateGasCostInUsd(gasLimit, provider) {
  try {
    console.log(
      'estimateGasCostInUsd: Estimating gas cost for limit:',
      gasLimit.toString()
    );
    const gasPrice = await provider.getGasPrice();
    const ethPrice = await getEthPriceInUsd();
    const ethCost = ethers.utils.formatEther(gasPrice.mul(gasLimit));
    const usdCost = (Number(ethCost) * ethPrice).toFixed(2);
    console.log('estimateGasCostInUsd: Estimated USD cost:', usdCost);
    return usdCost;
  } catch (error) {
    console.error('estimateGasCostInUsd: Error estimating gas cost:', error);
    toast.error('Failed to estimate gas cost');
    return 'N/A';
  }
}

export { getEthPriceInUsd, convertUsdToEth, estimateGasCostInUsd };
