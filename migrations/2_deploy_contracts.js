const Token = artifacts.require("AdamToken");
const Exchanger = artifacts.require("Exchanger");

module.exports = async function(deployer) {
  // Deploy Token
  await deployer.deploy(Token);
  const token = await Token.deployed()

  // Deploy Exchanger
  await deployer.deploy(Exchanger, token.address);
  const exchanger = await Exchanger.deployed()

  // Transfer all tokens to Exchanger (1 million)
  await token.transfer(exchanger.address, '1000000000000000000000000')
};
