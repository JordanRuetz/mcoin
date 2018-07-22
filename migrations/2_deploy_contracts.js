var mcoin = artifacts.require("./mcoin.sol");
var mcoinSale = artifacts.require("./mcoinSale.sol");

module.exports = function(deployer) {
  deployer.deploy(mcoin, 1000000).then(function() {
  	return deployer.deploy(mcoinSale, mcoin.address, 1000000000000000);
  });
};
