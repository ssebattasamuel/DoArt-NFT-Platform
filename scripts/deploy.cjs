const { ethers } = require('hardhat');
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  const EscrowStorage = await ethers.getContractFactory('EscrowStorage');
  const escrowStorage = await EscrowStorage.deploy();
  console.log('EscrowStorage deployed to:', escrowStorage.address);

  const DoArt = await ethers.getContractFactory('DoArt');
  const doArt = await DoArt.deploy(escrowStorage.address);
  console.log('DoArt deployed to:', doArt.address);

  const EscrowAuctions = await ethers.getContractFactory('EscrowAuctions');
  const escrowAuctions = await EscrowAuctions.deploy(escrowStorage.address);
  console.log('EscrowAuctions deployed to:', escrowAuctions.address);

  const EscrowListings = await ethers.getContractFactory('EscrowListings');
  const escrowListings = await EscrowListings.deploy(
    escrowStorage.address,
    escrowAuctions.address
  );
  console.log('EscrowListings deployed to:', escrowListings.address);

  const EscrowLazyMinting = await ethers.getContractFactory(
    'EscrowLazyMinting'
  );
  const escrowLazyMinting = await EscrowLazyMinting.deploy(
    escrowStorage.address
  );
  console.log('EscrowLazyMinting deployed to:', escrowLazyMinting.address);

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
  await doArt.grantRole(await doArt.MINTER_ROLE(), escrowLazyMinting.address);
  console.log('Roles granted');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
