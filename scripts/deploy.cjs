const hre = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

async function main() {
  //setup accounts
  [buyer, seller, signer] = await ethers.getSigners();

  // deploy doArt
  const DoArt = await ethers.getContractFactory('DoArt');
  const doArt = await DoArt.deploy();
  await doArt.deployed();

  console.log(`Deployed DoArt contract at: ${doArt.address}`);

  let transaction = await doArt
    .connect(seller)
    .mint(
      'https://ipfs.io/ipfs/QmdnpYDcJM4YMXJYnMx3ueSuAGNC95jFBVvKSVZtTG5PM8.json'
    );
  await transaction.wait();
  // deploy escrow
  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy(doArt.address, seller.address);
  await escrow.deployed();
  console.log(`Deployed escrow at :${escrow.address}`);
  // approve art
  transaction = await doArt.connect(seller).approve(escrow.address, 1);
  await transaction.wait();
  // listing  sales
  transaction = await escrow
    .connect(seller)
    .listNft(
      1,
      buyer.address,
      tokens(10),
      tokens(5),
      'copyright@ssebattasamuel'
    );

  await transaction.wait();

  console.log('finished');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
