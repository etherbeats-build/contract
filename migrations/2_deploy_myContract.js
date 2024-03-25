const EtherbeastContract =  artifacts.require("EtherBeast");

module.exports = function(deployer, network, accounts){
  const OWNER = accounts[0];
  const MARKETING_WALLET = accounts[1];
  const AIRDROP_WALLET = accounts[2];
  const URI = 'https://elementals-metadata.azuki.com/elemental/'
  deployer.deploy(EtherbeastContract, OWNER, MARKETING_WALLET, AIRDROP_WALLET, URI);
}