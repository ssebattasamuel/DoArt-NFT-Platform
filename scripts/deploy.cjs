const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const EscrowStorage = await ethers.getContractFactory('EscrowStorage');
  const escrowStorage = await EscrowStorage.deploy();
  await escrowStorage.deployed();
  console.log('EscrowStorage:', escrowStorage.address);

  const DoArt = await ethers.getContractFactory('DoArt');
  const doArt = await DoArt.deploy(escrowStorage.address);
  await doArt.deployed();
  console.log('DoArt:', doArt.address);

  const EscrowAuctions = await ethers.getContractFactory('EscrowAuctions');
  const escrowAuctions = await EscrowAuctions.deploy(
    escrowStorage.address,
    ethers.constants.AddressZero
  );
  await escrowAuctions.deployed();
  console.log('EscrowAuctions:', escrowAuctions.address);

  const EscrowListings = await ethers.getContractFactory('EscrowListings');
  const escrowListings = await EscrowListings.deploy(
    escrowStorage.address,
    escrowAuctions.address
  );
  await escrowListings.deployed();
  console.log('EscrowListings:', escrowListings.address);

  await escrowAuctions.setEscrowListings(escrowListings.address);
  console.log(
    'EscrowAuctions updated with EscrowListings:',
    escrowListings.address
  );

  const EscrowLazyMinting = await ethers.getContractFactory(
    'EscrowLazyMinting'
  );
  const escrowLazyMinting = await EscrowLazyMinting.deploy(
    escrowStorage.address
  );
  await escrowLazyMinting.deployed();
  console.log('EscrowLazyMinting:', escrowLazyMinting.address);

  // Grant ADMIN_ROLE
  await escrowStorage.grantRole(
    await escrowStorage.ADMIN_ROLE(),
    escrowListings.address
  );
  await escrowStorage.grantRole(
    await escrowStorage.ADMIN_ROLE(),
    escrowAuctions.address
  );
  await escrowStorage.grantRole(
    await escrowStorage.ADMIN_ROLE(),
    escrowLazyMinting.address
  );
  await escrowStorage.grantRole(
    await escrowStorage.ADMIN_ROLE(),
    doArt.address
  );

  // Grant roles to DoArt
  await doArt.grantRole(await doArt.MINTER_ROLE(), escrowLazyMinting.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
