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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { signal: controller.signal } // Attach signal for abort
    );
    const data = await response.json();
    cachedEthPrice = data.ethereum.usd;
    lastFetchTime = now;
    console.log('getEthPriceInUsd: Fetched ETH price:', cachedEthPrice);
    return cachedEthPrice;
  } catch (error) {
    console.error('getEthPriceInUsd: Error fetching ETH price:', error);
    if (error.name === 'AbortError') {
      toast.error('ETH price fetch timed out. Using cached or default value.');
      if (cachedEthPrice) {
        console.log(
          'getEthPriceInUsd: Using cached ETH price:',
          cachedEthPrice
        );
        return cachedEthPrice;
      }
      return 4659; // Fallback default ETH price (~$4659 USD as of Aug 15, 2025)
    }
    toast.error('Failed to fetch ETH price');
    if (cachedEthPrice) {
      console.log('getEthPriceInUsd: Using cached ETH price:', cachedEthPrice);
      return cachedEthPrice;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId); // Always clear timeout
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
