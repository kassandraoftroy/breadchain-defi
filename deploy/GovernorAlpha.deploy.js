module.exports = async (hre) => {
    if (hre.network.name === "mainnet") {
      console.log(
        "\n\n Deploying GovernorAlpha to mainnet. Hit ctrl + c to abort"
      );
      console.log("❗ GovernorAlpha DEPLOYMENT: VERIFY");
      await new Promise(r => setTimeout(r, 30000));
    }
    const { deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await hre.getNamedAccounts();
    await deploy("GovernorAlpha", {
      from: deployer,
      args: [
        "PooledLP Governor Alpha",
        (await deployments.get("Timelock")).address,
        (await deployments.get("PooledLPWithBorrowToken")).address,
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

module.exports.dependencies = ["Timelock", "PooledLPWithBorrowToken"];
module.exports.tags = ["GovernorAlpha"];