module.exports = async (hre) => {
    if (hre.network.name === "mainnet") {
      console.log(
        "\n\n Deploying Timelock to mainnet. Hit ctrl + c to abort"
      );
      console.log("❗ Timelock DEPLOYMENT: VERIFY");
      await new Promise(r => setTimeout(r, 30000));
    }
    const { deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await hre.getNamedAccounts();
    await deploy("Timelock", {
      from: deployer,
      args: [
        deployer,
        600,
      ],
    });
};

module.exports.skip = async (hre) => {
  const skip =
    hre.network.name === "mainnet" ||
    hre.network.name === "rinkeby" ||
    hre.network.name === "ropsten"
  return skip ? true : false;
};

module.exports.tags = ["Timelock"];