const EtherbeastContract = artifacts.require("Etherbeast"); // 1️⃣
const ethers = require("ethers");

const PRIVATE_KEY_ACCOUNT = {
  "0xd1758040065f1427fa83269cacba0a3149ba8247":
    "971dbb66657415a9bfe8820adf9b2f426fb0b49a82a4048004debab3783c7576",
};
const decimal = 10 ** 18;
const TOTAL_SUPPLY = 10001;
const QUANTITY_TO_AIRDROP = 10;

contract("EtherBeast", (accounts) => {
  const OWNER_WALLET = accounts[0];
  const MARKETING_WALLET = accounts[1];
  const AIRDROP_WALLET = accounts[2];
  const RECEIVER_WALLET = accounts[3];
  const TRANSFER_WALLET = accounts[4];
  const SIGNER_WALLET = accounts[5];

  it("Contract Deployed Successfully!", async () => { // 3️⃣
      const myContract = await EtherbeastContract.deployed();
      assert(myContract, "Contract Deployment Failed!"); // 4️⃣
  });
  it("should allow owner wallet to make transfer", async () => {
    const myContractInstance = await EtherbeastContract.deployed();
    await myContractInstance.setWhitelist(OWNER_WALLET, { from: OWNER_WALLET });
    const isWhitelist = await myContractInstance.whitelist(OWNER_WALLET);
    assert.equal(isWhitelist, true);
  });

  it("should airdrop to airdrop wallet", async () => {
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
  it("should airdrop token", async () => {
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
  it("should update the phase of the NFT", async() => {
    const NEW_URI = "https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/"
    const NEW_PHASE = 1;
    const myContractInstance = await EtherbeastContract.deployed();
    await myContractInstance.setPhase(NEW_PHASE, { from: OWNER_WALLET });
    const currentPhase = parseInt(await myContractInstance.currentEvolution());
    assert.equal(currentPhase, NEW_PHASE, "Wrong phase");
    await myContractInstance.setPhaseURI(NEW_PHASE, NEW_URI, { from: OWNER_WALLET });
    const tokenURI = await myContractInstance.tokenURI(0);
    assert.equal(tokenURI, `${NEW_URI}0`, "Wrong evolution");
  })

  it("should test the overloop on URI (when it passed the totalSupply)", async() => {
    const myContractInstance = await EtherbeastContract.deployed();
    const tokenId = 1040924;
    const tokenURISplited = (await myContractInstance.tokenURI(1040924))?.split('/');
    assert.equal(tokenURISplited?.[tokenURISplited.length - 1], tokenId % TOTAL_SUPPLY, "Wrong token uri / Id");
  })
  it("should test the tax rate", async () => {
    const myContractInstance = await EtherbeastContract.deployed();
    const taxRate = 10;
    await myContractInstance.setActivateTax(true);
    assert.equal(
      await myContractInstance.activeTax(),
      true,
      "Tax rate is not active"
    );
    await myContractInstance.setTaxRate(taxRate);
    assert.equal(
      await myContractInstance.taxRate(),
      taxRate,
      "Tax rate is different"
    );
    // Now lets test the the airdropped function
    await myContractInstance.transfer(
      TRANSFER_WALLET,
      ethers.BigNumber.from((QUANTITY_TO_AIRDROP * decimal).toString()),
      { from: OWNER_WALLET }
    );
    const balance =
      parseInt(await myContractInstance.balanceOf(TRANSFER_WALLET)) / decimal;
    assert.equal(
      balance,
      QUANTITY_TO_AIRDROP * (1 - taxRate / 100),
      "Tax rate wasnt applied"
    );
    const balanceMarketingWallet =
      parseInt(await myContractInstance.balanceOf(MARKETING_WALLET)) / decimal;
    assert.equal(
      balanceMarketingWallet,
      QUANTITY_TO_AIRDROP * (taxRate / 100),
      "Marketing wallet didnt receive the funds"
    );
  });
  it("should set the signer", async() => {
    const myContractInstance = await EtherbeastContract.deployed();
    await myContractInstance.setAuthorizedSigner(SIGNER_WALLET, { from: OWNER_WALLET })
    assert.equal(await myContractInstance._authorizedSigner(), SIGNER_WALLET, "Wrong signer setted");
  })

  it("should test if the contract is on paused", async() => {
    const myContractInstance = await EtherbeastContract.deployed();
    assert.equal(await myContractInstance.paused(), false, "Contract shouldnt be in paused");
  })
});
