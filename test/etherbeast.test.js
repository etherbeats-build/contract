const EtherbeastContract = artifacts.require("Etherbeast"); // 1️⃣
const ethers = require("ethers");

const PRIVATE_KEY_ACCOUNT = {
  "0xd1758040065f1427fa83269cacba0a3149ba8247":
    "971dbb66657415a9bfe8820adf9b2f426fb0b49a82a4048004debab3783c7576",
};
const decimal = 10 ** 18;

contract("EtherBeast", (accounts) => {
  // it("Contract Deployed Successfully!", async () => { // 3️⃣
  //     const myContract = await EtherbeastContract.deployed();
  //     assert(myContract, "Contract Deployment Failed!"); // 4️⃣
  // });

  it("should allow owner wallet to make transfer", async () => {
    const myContractInstance = await EtherbeastContract.deployed();
    const OWNER_WALLET = accounts[0];
    await myContractInstance.setWhitelist(OWNER_WALLET, { from: OWNER_WALLET });
    const isWhitelist = await myContractInstance.whitelist(OWNER_WALLET);
    assert.equal(isWhitelist, true);
  });

  it("should airdrop to airdrop wallet", async () => {
    const AIRDROP_WALLET = accounts[2];
    const QUANTITY_TO_TRANSFER = 500;
    const myContractInstance = await EtherbeastContract.deployed();
    await myContractInstance.setWhitelist(AIRDROP_WALLET, {
      from: accounts[0],
    });
    const isWhitelist = await myContractInstance.whitelist(AIRDROP_WALLET);
    assert.equal(isWhitelist, true);
    await myContractInstance.transfer(
      AIRDROP_WALLET,
      ethers.BigNumber.from((QUANTITY_TO_TRANSFER * decimal).toString()),
      { from: accounts[0] }
    );
    const balance =
      parseInt(await myContractInstance.balanceOf(AIRDROP_WALLET)) / decimal;
    assert.equal(balance, QUANTITY_TO_TRANSFER, "The tokens wasnt sent");
  });
  // it("should recover signer from message and signature", async () => {
  //   const myContractInstance = await EtherbeastContract.deployed();
  //   const signer = accounts[0];
  //   const authorizedSigner = await myContractInstance._authorizedSigner();
  //   assert.equal(
  //     signer,
  //     authorizedSigner,
  //     "Authorized signer not set correctly"
  //   );
  //   const signerAccount = new ethers.Wallet(
  //     PRIVATE_KEY_ACCOUNT[signer.toLowerCase()]
  //   );
  //   const amount = 1500000000;
  //   const nonce = 1029848293193;
  //   const encodedMessage = ethers.utils.defaultAbiCoder.encode(
  //     ["uint256", "uint256"],
  //     [amount, nonce]
  //   );
  //   const hashedMessage = ethers.utils.keccak256(encodedMessage);
  //   const sig = await signerAccount.signMessage(
  //     ethers.utils.arrayify(hashedMessage)
  //   );
  //   const recoverSigner = await myContractInstance.verifySigner(
  //     nonce,
  //     amount,
  //     sig
  //   );

  //   assert.equal(signer, recoverSigner, "Authorized signer not set correctly");
  // });

  // it("should not allowed recover with wrong message and signature", async () => {
  //   const myContractInstance = await EtherbeastContract.deployed();
  //   const signer = accounts[0];
  //   const authorizedSigner = await myContractInstance._authorizedSigner();
  //   assert.equal(
  //     signer,
  //     authorizedSigner,
  //     "Authorized signer not set correctly"
  //   );
  //   const signerAccount = new ethers.Wallet(
  //     PRIVATE_KEY_ACCOUNT[signer.toLowerCase()]
  //   );
  //   const amount = 1500000000;
  //   const nonce = 1029848293193;
  //   const encodedMessage = ethers.utils.defaultAbiCoder.encode(
  //     ["uint256", "uint256"],
  //     [amount, nonce]
  //   );
  //   const hashedMessage = ethers.utils.keccak256(encodedMessage);
  //   const sig = await signerAccount.signMessage(
  //     ethers.utils.arrayify(hashedMessage)
  //   );
  //   const recoverSigner = await myContractInstance.verifySigner(
  //     nonce, // wrong nonce
  //     amount + 20, // wrong amount
  //     sig
  //   );

  //   assert.notEqual(
  //     signer,
  //     recoverSigner,
  //     "Authorized signer not set correctly"
  //   );
  // });
  // it("should transfer to airdrop wallet", async () => {
  //   const myContractInstance = await EtherbeastContract.deployed();
  //   const AIRDROP_WALLET = accounts[2];
  //   const OWNER_WALLET = accounts[0];
  //   // first let check the balacnce of the owner
  // const balanceOwner =
  //   parseInt(await myContractInstance.balanceOf(OWNER_WALLET)) / decimal;
  //   assert(balanceOwner > 0, "Owner balance should be positif");
  //   // second step
  //   // WHITELIST THE AIRDROP
  //   await myContractInstance.setWhitelist(AIRDROP_WALLET, { from: accounts[0] });
  //   // const isWhitelist = await myContractInstance.whitelist(AIRDROP_WALLET);
  //   // assert.equal(isWhitelist, true)
  //   await myContractInstance.transfer(
  //     AIRDROP_WALLET,
  //     ethers.BigNumber.from((100 * decimal).toString()),
  //     { from: accounts[0] }
  //   );
    // console.log(
    //   parseInt(await myContractInstance.balanceOf(AIRDROP_WALLET)) / decimal
    // );

  //   // lets check if its whitelisted
  // });
  it("should airdrop token", async () => {
    const RECEIVER_WALLET = accounts[3];
    const OWNER_WALLET = accounts[0];
    const QUANTITY_TO_AIRDROP = 10;
    const myContractInstance = await EtherbeastContract.deployed();
    const authorizedSigner = await myContractInstance._authorizedSigner();
    assert.equal(
      OWNER_WALLET,
      authorizedSigner,
      "Authorized signer not set correctly"
    );
    const signerAccount = new ethers.Wallet(
      PRIVATE_KEY_ACCOUNT[OWNER_WALLET.toLowerCase()]
    );
    const amount = ethers.BigNumber.from((QUANTITY_TO_AIRDROP * decimal).toString());
    const nonce = 1029848293193;
    const encodedMessage = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256"],
      [amount, nonce]
    );
    const hashedMessage = ethers.utils.keccak256(encodedMessage);
    const sig = await signerAccount.signMessage(
      ethers.utils.arrayify(hashedMessage)
    );
    await myContractInstance.setWhitelist(RECEIVER_WALLET, {
      from: OWNER_WALLET,
    });
    await myContractInstance.withdrawAirdrop(nonce, amount, sig, {
      from: RECEIVER_WALLET,
    });
    const balance = parseInt(await myContractInstance.balanceOf(RECEIVER_WALLET)) / decimal
    assert.equal(balance, QUANTITY_TO_AIRDROP, "Not airdroped")
  });
});
