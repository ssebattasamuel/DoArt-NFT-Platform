const { ethers } = require('hardhat');
async function checkBytecodeSize() {
  const factories = [
    { name: 'DoArt', factory: await ethers.getContractFactory('DoArt') },
    {
      name: 'EscrowStorage',
      factory: await ethers.getContractFactory('EscrowStorage'),
    },
    {
      name: 'EscrowListings',
      factory: await ethers.getContractFactory('EscrowListings'),
    },
    {
      name: 'EscrowAuctions',
      factory: await ethers.getContractFactory('EscrowAuctions'),
    },
    {
      name: 'EscrowLazyMinting',
      factory: await ethers.getContractFactory('EscrowLazyMinting'),
    },
  ];
  for (const { name, factory } of factories) {
    const bytecode = factory.bytecode;
    console.log(`${name} bytecode size: ${bytecode.length / 2} bytes`);
  }
}
checkBytecodeSize();
