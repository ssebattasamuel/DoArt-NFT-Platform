const hre = require('hardhat');
const fs = require('fs');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);
  console.log(
    'Deployer balance:',
    hre.ethers.utils.formatEther(await deployer.getBalance()),
    'ETH'
  );

  // Deploy DoArt with AddressZero as placeholder
  const DoArt = await hre.ethers.getContractFactory('DoArt');
  const doArt = await DoArt.deploy(hre.ethers.constants.AddressZero);
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

  // Deploy EscrowAuctions with AddressZero for EscrowListings
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
    'EscrowAuctions updated with EscrowListings address:',
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

  // Grant roles
  const ADMIN_ROLE = await escrowStorage.ADMIN_ROLE();
  const ARTIST_ROLE = await doArt.ARTIST_ROLE();
  const PAUSER_ROLE = await doArt.PAUSER_ROLE();
  const MINTER_ROLE = await doArt.MINTER_ROLE();

  await doArt.grantRole(ARTIST_ROLE, deployer.address);
  await doArt.grantRole(PAUSER_ROLE, deployer.address);
  await doArt.grantRole(MINTER_ROLE, deployer.address);
  await doArt.grantRole(MINTER_ROLE, escrowLazyMinting.address);
  await escrowStorage.grantRole(ADMIN_ROLE, doArt.address);
  await escrowStorage.grantRole(ADMIN_ROLE, escrowListings.address);
  await escrowStorage.grantRole(ADMIN_ROLE, escrowAuctions.address);
  await escrowStorage.grantRole(ADMIN_ROLE, escrowLazyMinting.address);
  console.log('Roles assigned successfully');

  // Save contract addresses for frontend
  const addresses = {
    DoArt: doArt.address,
    EscrowStorage: escrowStorage.address,
    EscrowListings: escrowListings.address,
    EscrowAuctions: escrowAuctions.address,
    EscrowLazyMinting: escrowLazyMinting.address
  };
  fs.writeFileSync(
    'contract-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log(
    'Contract addresses saved to contract-addresses.json:',
    JSON.stringify(addresses, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
