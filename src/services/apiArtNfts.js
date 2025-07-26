import { ethers } from 'ethers';
import { uploadToPinata } from './pinata';
import { toast } from 'react-hot-toast';

export async function createNft(
  { title, purchasePrice, description, image, royaltyBps = 500 },
  { doArt, escrowListings }
) {
  const imageUri = await uploadToPinata(image);
  const metadata = { name: title, description, image: imageUri };
  const metadataUri = await uploadToPinata(metadata, true);

  const mintTx = await doArt.mint(metadataUri, royaltyBps);
  await mintTx.wait();

  const totalSupply = await doArt.totalSupply();
  const tokenId = totalSupply.toString();

  const approveTx = await doArt.approve(escrowListings.address, tokenId);
  await approveTx.wait();

  const price = ethers.utils.parseEther(purchasePrice.toString());
  const escrowAmount = ethers.utils.parseEther('0.01');
  const listTx = await escrowListings.list(
    doArt.address,
    tokenId,
    ethers.constants.AddressZero,
    price,
    0,
    escrowAmount,
    false,
    0
  );
  await listTx.wait();

  return { tokenId, title, purchasePrice, description, imageUri, metadataUri };
}

export async function batchMintNfts(nfts, { doArt, escrowListings }) {
  const tokenIds = [];
  for (const nft of nfts) {
    const { title, description, image, royaltyBps = 500 } = nft;
    const imageUri = await uploadToPinata(image);
    const metadata = { name: title, description, image: imageUri };
    const metadataUri = await uploadToPinata(metadata, true);

    const mintTx = await doArt.mint(metadataUri, royaltyBps);
    await mintTx.wait();

    const totalSupply = await doArt.totalSupply();
    const tokenId = totalSupply.toString();
    tokenIds.push(tokenId);

    const approveTx = await doArt.approve(escrowListings.address, tokenId);
    await approveTx.wait();
  }
  return tokenIds;
}

export async function batchListNfts(listings, { escrowListings, doArt }) {
  // const nftContracts = (listings || []).map(() => doArt.address);
  // const tokenIds = (listings || []).map((l) => l.tokenId);
  // const buyers = (listings || []).map(() => ethers.constants.AddressZero);
  // const prices = (listings || []).map((l) =>
  //   ethers.utils.parseEther(l.price.toString())
  // );
  // const minBids = (listings || []).map((l) =>
  //   ethers.utils.parseEther(l.minBid.toString())
  // );
  // const escrowAmounts = (listings || []).map(() =>
  //   ethers.utils.parseEther('0.01')
  // );
  // const isAuctions = (listings || []).map((l) => l.isAuction);
  // const auctionDurations = (listings || []).map((l) =>
  //   l.isAuction ? l.auctionDuration * 3600 : 0
  // );
  // for (const tokenId of tokenIds) {
  //   const approveTx = await doArt.approve(escrowListings.address, tokenId);
  //   await approveTx.wait();
  // }
  // const listTx = await escrowListings.batchList(
  //   nftContracts,
  //   tokenIds,
  //   buyers,
  //   prices,
  //   minBids,
  //   escrowAmounts,
  //   isAuctions,
  //   auctionDurations
  // );
  // await listTx.wait();
  // return tokenIds;
}

export async function placeBid(
  { contractAddress, tokenId, amount },
  { escrowAuctions }
) {
  const bidAmount = ethers.utils.parseEther(amount.toString());
  const tx = await escrowAuctions.batchPlaceBid(
    contractAddress,
    [tokenId],
    [bidAmount],
    { value: bidAmount }
  );
  await tx.wait();
  return { contractAddress, tokenId, amount: bidAmount };
}

export async function batchPlaceBids(bids, { escrowAuctions }) {
  // const contractAddress = bids[0].contractAddress;
  // const tokenIds = (bids || []).map((b) => b.tokenId);
  // const amounts = (bids || []).map((b) =>
  //   ethers.utils.parseEther(b.amount.toString())
  // );
  // const totalValue = amounts.reduce(
  //   (sum, amt) => sum.add(amt),
  //   ethers.BigNumber.from(0)
  // );
  // const tx = await escrowAuctions.batchPlaceBid(
  //   contractAddress,
  //   tokenIds,
  //   amounts,
  //   { value: totalValue }
  // );
  // await tx.wait();
  // return bids;
}

export async function placeAuctionBid(
  { contractAddress, tokenId, amount },
  { escrowAuctions }
) {
  const bidAmount = ethers.utils.parseEther(amount.toString());
  const tx = await escrowAuctions.batchPlaceAuctionBid(
    contractAddress,
    [tokenId],
    [bidAmount],
    { value: bidAmount }
  );
  await tx.wait();
  return { contractAddress, tokenId, amount: bidAmount };
}

export async function batchPlaceAuctionBids(bids, { escrowAuctions }) {
  // const contractAddress = bids[0].contractAddress;
  // const tokenIds = (bids || []).map((b) => b.tokenId);
  // const amounts = (bids || []).map((b) =>
  //   ethers.utils.parseEther(b.amount.toString())
  // );
  // const totalValue = amounts.reduce(
  //   (sum, amt) => sum.add(amt),
  //   ethers.BigNumber.from(0)
  // );
  // const tx = await escrowAuctions.batchPlaceAuctionBid(
  //   contractAddress,
  //   tokenIds,
  //   amounts,
  //   { value: totalValue }
  // );
  // await tx.wait();
  // return bids;
}
export async function editListing(
  { contractAddress, tokenId, purchasePrice },
  { escrowListings }
) {
  const price = ethers.utils.parseEther(purchasePrice.toString());

  const tx = await escrowListings.updateListing(
    contractAddress,
    tokenId,
    price
  );
  await tx.wait();

  return { contractAddress, tokenId, purchasePrice };
}

export async function createLazyMintVoucher(
  { title, description, image, price, royaltyBps = 500 },
  { doArt, escrowLazyMinting, signer }
) {
  const imageUri = await uploadToPinata(image);
  const metadata = { name: title, description, image: imageUri };
  const metadataUri = await uploadToPinata(metadata, true);

  const tokenId = (await doArt.totalSupply()).add(1).toString();
  const priceWei = ethers.utils.parseEther(price.toString());

  const messageHash = ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'uint256', 'string', 'uint96'],
    [doArt.address, tokenId, priceWei, metadataUri, royaltyBps]
  );
  const signature = await signer.signMessage(
    ethers.utils.arrayify(messageHash)
  );

  return {
    tokenId,
    creator: await signer.getAddress(),
    price: priceWei,
    uri: metadataUri,
    royaltyBps,
    signature
  };
}

export async function redeemLazyMint(voucher, { escrowLazyMinting }) {
  const tx = await escrowLazyMinting.redeemLazyMint(
    escrowLazyMinting.address,
    voucher,
    { value: voucher.price }
  );
  await tx.wait();
  return voucher.tokenId;
}

export async function cancelListing(
  { contractAddress, tokenId },
  { escrowListings }
) {
  const tx = await escrowListings.cancelSale(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function pauseContract(contract, contractName) {
  const tx = await contract.pause();
  await tx.wait();
  toast.success(`${contractName} paused`);
}

export async function unpauseContract(contract, contractName) {
  const tx = await contract.unpause();
  await tx.wait();
  toast.success(`${contractName} unpaused`);
}

export async function acceptBid(
  { contractAddress, tokenId, bidIndex },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.acceptBid(contractAddress, tokenId, bidIndex);
  await tx.wait();
  return { contractAddress, tokenId, bidIndex };
}

export async function endAuction(
  { contractAddress, tokenId },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.endAuction(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function burnNft(tokenId, { doArt }) {
  const tx = await doArt.burn(tokenId);
  await tx.wait();
  return tokenId;
}

export async function setArtistMetadata(
  { name, bio, portfolioUrl },
  { doArt }
) {
  const tx = await doArt.setArtistMetadata(name, bio, portfolioUrl);
  await tx.wait();
  return { name, bio, portfolioUrl };
}

export async function getArtistMetadata(artist, { doArt }) {
  return await doArt.getArtistMetadata(artist);
}

export async function setTokenRoyalty(
  { tokenId, recipient, royaltyBps },
  { doArt }
) {
  const tx = await doArt.setTokenRoyalty(tokenId, recipient, royaltyBps);
  await tx.wait();
  return { tokenId, recipient, royaltyBps };
}

export async function getTokenDetails(tokenId, { doArt }) {
  return await doArt.getTokenDetails(tokenId);
}

export async function cancelAuction(
  { contractAddress, tokenId },
  { escrowAuctions }
) {
  const tx = await escrowAuctions.cancelAuction(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function depositEarnest(
  { contractAddress, tokenId, amount },
  { escrowListings }
) {
  const tx = await escrowListings.depositEarnest(contractAddress, tokenId, {
    value: amount
  });
  await tx.wait();
  return { contractAddress, tokenId, amount };
}

export async function approveArtwork(
  { contractAddress, tokenId, approved },
  { escrowListings }
) {
  const tx = await escrowListings.approveArtwork(
    contractAddress,
    tokenId,
    approved
  );
  await tx.wait();
  return { contractAddress, tokenId, approved };
}

export async function updateListing(
  { contractAddress, tokenId, price },
  { escrowListings }
) {
  const priceWei = ethers.utils.parseEther(price.toString());
  const tx = await escrowListings.updateListing(
    contractAddress,
    tokenId,
    priceWei
  );
  await tx.wait();
  return { contractAddress, tokenId, price };
}

export async function cancelSale(
  { contractAddress, tokenId },
  { escrowListings }
) {
  const tx = await escrowListings.cancelSale(contractAddress, tokenId);
  await tx.wait();
  return { contractAddress, tokenId };
}

export async function list(data, { escrowListings }) {
  const tx = await escrowListings.list(
    data.nftContract,
    data.tokenId,
    data.buyer,
    data.price,
    data.minBid,
    data.escrowAmount,
    data.isAuction,
    data.auctionDuration
  );
  await tx.wait();
  return data;
}

export async function batchList(data, { escrowListings }) {
  const tx = await escrowListings.batchList(
    data.nftContracts,
    data.tokenIds,
    data.buyers,
    data.prices,
    data.minBids,
    data.escrowAmounts,
    data.isAuctions,
    data.auctionDurations
  );
  await tx.wait();
  return data;
}
