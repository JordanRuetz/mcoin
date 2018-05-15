var mcoin = artifacts.require("./mcoin.sol");

module.exports = function(deployer) {
  deployer.deploy(mcoin);
};
