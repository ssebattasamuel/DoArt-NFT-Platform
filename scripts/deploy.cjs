const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  // Deploy DoArt first
  const DoArt = await hre.ethers.getContractFactory('DoArt');
  const doArt = await DoArt.deploy(hre.ethers.constants.AddressZero); // Temporary address
  await doArt.deployed();
  console.log('DoArt deployed to:', doArt.address);

  // Deploy EscrowStorage with DoArt address
  const EscrowStorage = await hre.ethers.getContractFactory('EscrowStorage');
  const escrowStorage = await EscrowStorage.deploy(doArt.address);
  await escrowStorage.deployed();
  console.log('EscrowStorage deployed to:', escrowStorage.address);

  // Update DoArt with EscrowStorage address
  await doArt.setStorageContract(escrowStorage.address);
  console.log(
    'DoArt updated with EscrowStorage address:',
    escrowStorage.address
  );

  // Deploy EscrowAuctions
  const EscrowAuctions = await hre.ethers.getContractFactory('EscrowAuctions');
  const escrowAuctions = await EscrowAuctions.deploy(
    escrowStorage.address,
    hre.ethers.constants.AddressZero
  );
  await escrowAuctions.deployed();
  console.log('EscrowAuctions deployed to:', escrowAuctions.address);

  // Deploy EscrowListings
  const EscrowListings = await hre.ethers.getContractFactory('EscrowListings');
  const escrowListings = await EscrowListings.deploy(
    escrowStorage.address,
    escrowAuctions.address
  );
  await escrowListings.deployed();
  console.log('EscrowListings deployed to:', escrowListings.address);

  // Update EscrowAuctions with EscrowListings address
  await escrowAuctions.setEscrowListings(escrowListings.address);
  console.log(
    'EscrowAuctions updated with EscrowListings:',
    escrowListings.address
  );

  // Deploy EscrowLazyMinting
  const EscrowLazyMinting =
    await hre.ethers.getContractFactory('EscrowLazyMinting');
  const escrowLazyMinting = await EscrowLazyMinting.deploy(
    escrowStorage.address
  );
  await escrowLazyMinting.deployed();
  console.log('EscrowLazyMinting deployed to:', escrowLazyMinting.address);

  // Grant ADMIN_ROLE
  const ADMIN_ROLE = await escrowStorage.ADMIN_ROLE();
  await escrowStorage.grantRole(ADMIN_ROLE, escrowListings.address);
  await escrowStorage.grantRole(ADMIN_ROLE, escrowAuctions.address);
  await escrowStorage.grantRole(ADMIN_ROLE, escrowLazyMinting.address);
  await escrowStorage.grantRole(ADMIN_ROLE, doArt.address);

  // Grant MINTER_ROLE to EscrowLazyMinting
  const MINTER_ROLE = await doArt.MINTER_ROLE();
  await doArt.grantRole(MINTER_ROLE, escrowLazyMinting.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
