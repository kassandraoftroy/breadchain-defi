module.exports = async (hre) => {
    if (hre.network.name === "mainnet") {
      console.log(
        "\n\n Deploying Dough to mainnet. Hit ctrl + c to abort"
      );
      console.log("❗ Dough DEPLOYMENT: VERIFY");
      await new Promise(r => setTimeout(r, 30000));
    }
    const { deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await hre.getNamedAccounts();
    await deploy("Yeast", {
      from: deployer,
      args: [
        hre.network.config.daiAddress,
        hre.network.config.cDaiAddress,
        200, // 500/10000 i.e. 5%
      ],
    });
};

module.exports.skip = async (hre) => {
  const skip =
    hre.network.name === "mainnet"
  return skip ? true : false;
};

module.exports.tags = ["Yeast"];