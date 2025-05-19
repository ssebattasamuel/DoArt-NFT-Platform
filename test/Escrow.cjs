const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};
describe('DoArt', () => {
  let buyer, seller, signer;
  let doArt, escrow;

  beforeEach(async () => {
    // set up accounts
    [buyer, seller, signer] = await ethers.getSigners();
    // deploy doArt
    const DoArt = await ethers.getContractFactory('DoArt');
    doArt = await DoArt.deploy();
    // mint
    let transaction = await doArt
      .connect(seller)
      .mint(
        'https://ipfs.io/ipfs/QmdnpYDcJM4YMXJYnMx3ueSuAGNC95jFBVvKSVZtTG5PM8.json'
      );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory('Escrow');
    escrow = await Escrow.deploy(doArt.address, seller.address);
    // approve property
    transaction = await doArt.connect(seller).approve(escrow.address, 1);
    await transaction.wait();
    // list Art
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
  });
  describe('Deployment', () => {
    it('returns Nft address', async () => {
      const result = await escrow.nftAddress();
      expect(result).to.equal(doArt.address);
    });
    it('returns the seller', async () => {
      const result = await escrow.seller();
      expect(result).to.equal(seller.address);
    });
  });
  describe('Listing', () => {
    it('Updates as Listed', async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });
    it('Updates ownership', async () => {
      expect(await doArt.ownerOf(1)).to.be.equal(escrow.address);
    });
    it('returns buyer', async () => {
      expect(await escrow.buyer(1)).to.equal(buyer.address);
    });
    it('Returns Purchase price', async () => {
      expect(await escrow.purchasePrice(1)).to.equal(tokens(10));
    });
    it('returns Escrow amount', async () => {
      expect(await escrow.escrowAmount(1)).to.equal(tokens(5));
    });
  });
  describe('Unlisting', () => {
    it('Updates as unlisted', async () => {
      const transaction = await escrow.connect(seller).unListNft(1);
      await transaction.wait();
      const result = await escrow.isListed(1);
      expect(result).to.equal(false);
    });
  });
  describe('Transfer', () => {
    it('updates ownership of nft', async () => {
      const transaction = await escrow
        .connect(seller)
        .transferNft(signer.address, 1);
      await transaction.wait();
      expect(await doArt.ownerOf(1)).to.equal(signer.address);
    });
  });
  describe('Deposits', () => {
    it('Updates contract balance', async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();
      expect(await escrow.getBalance()).to.equal(tokens(5));
    });
  });
  describe('Approval', () => {
    it('Updates sale approval status', async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      expect(await escrow.approval(1, buyer.address)).to.equal(true);
      expect(await escrow.approval(1, seller.address)).to.equal(true);
    });
  });
  describe('Sale', () => {
    beforeEach(async () => {
      let transaction = await escrow.connect(buyer).approveArtWork(1, true);
      await transaction.wait();
      transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(10) });
      await transaction.wait();
      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).finaliseSale(1);
      await transaction.wait();
    });
    it('Updates ownership', async () => {
      expect(await doArt.ownerOf(1)).to.be.equal(buyer.address);
    });
    it('Updates balance', async () => {
      expect(await escrow.getBalance()).to.equal(0);
    });
  });
  describe('Canceling', () => {
    it('Cancels a sale', async () => {
      let transaction = await escrow.connect(buyer).approveArtWork(1, false);
      await transaction.wait();

      transaction = await escrow.cancelSale(1);
      await transaction.wait();

      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
});
