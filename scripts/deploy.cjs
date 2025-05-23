const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const EscrowStorage = await ethers.getContractFactory('EscrowStorage');
  const escrowStorage = await EscrowStorage.deploy();
  await escrowStorage.deployed();
  console.log('EscrowStorage deployed to:', escrowStorage.address);

  const DoArt = await ethers.getContractFactory('DoArt');
  const doArt = await DoArt.deploy(escrowStorage.address);
  await doArt.deployed();
  console.log('DoArt deployed to:', doArt.address);

  // Deploy EscrowListings with placeholder
  const EscrowListings = await ethers.getContractFactory('EscrowListings');
  let escrowListings = await EscrowListings.deploy(
    escrowStorage.address,
    ethers.constants.AddressZero
  );
  await escrowListings.deployed();
  console.log(
    'EscrowListings (placeholder) deployed to:',
    escrowListings.address
  );

  const EscrowAuctions = await ethers.getContractFactory('EscrowAuctions');
  const escrowAuctions = await EscrowAuctions.deploy(
    escrowStorage.address,
    escrowListings.address
  );
  await escrowAuctions.deployed();
  console.log('EscrowAuctions deployed to:', escrowAuctions.address);

  // Redeploy EscrowListings with EscrowAuctions address
  escrowListings = await EscrowListings.deploy(
    escrowStorage.address,
    escrowAuctions.address
  );
  await escrowListings.deployed();
  console.log('EscrowListings deployed to:', escrowListings.address);

  const EscrowLazyMinting = await ethers.getContractFactory(
    'EscrowLazyMinting'
  );
  const escrowLazyMinting = await EscrowLazyMinting.deploy(
    escrowStorage.address
  );
  await escrowLazyMinting.deployed();
  console.log('EscrowLazyMinting deployed to:', escrowLazyMinting.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
