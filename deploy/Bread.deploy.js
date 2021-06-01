module.exports = async (hre) => {
    if (hre.network.name === "mainnet") {
      console.log(
        "\n\n Deploying BREAD to mainnet. Hit ctrl + c to abort"
      );
      console.log("❗ BREAD DEPLOYMENT: VERIFY");
      await new Promise(r => setTimeout(r, 30000));
    }
    const { deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await hre.getNamedAccounts();
    await deploy("Bread", {
      from: deployer,
      args: [
        hre.network.config.daiAddress,
        hre.network.config.cDaiAddress
      ],
    });
};

module.exports.skip = async (hre) => {
  const skip =
    hre.network.name === "mainnet"
  return skip ? true : false;
};

module.exports.tags = ["Bread"];