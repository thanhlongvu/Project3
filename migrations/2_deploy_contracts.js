// var TokenERC20 = artifacts.require("TokenERC20");

// module.exports = function(deployer) {
//   deployer.deploy(TokenERC20);
// };

var AccessControl = artifacts.require("AccessControl");
var PlotBase = artifacts.require("PlotBase");
var User = artifacts.require("User");
var TokenERC20 = artifacts.require("TokenERC20");

module.exports = function(deployer) {
  deployer.deploy(AccessControl)
  .then(() => {
    return deployer.deploy(User, AccessControl.address);
  }).then(() => {
    return deployer.deploy(PlotBase, AccessControl.address, User.address);
  }).then(() => {
    return deployer.deploy(TokenERC20, PlotBase.address, AccessControl.address, User.address);
  });
};
