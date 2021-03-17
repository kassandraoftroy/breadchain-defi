const { ethers, network } = require("hardhat");

module.exports.getDaiFromFaucet = async (recepient, amount) => {
    // Fetch actual Faucet
    const faucet = network.config.daiFaucetAddress;
    const faucetEthBalance = await (
      await ethers.provider.getSigner(faucet)
    ).getBalance();
    const oneEth = ethers.utils.parseEther("1");
  
    // Pre-fund faucet account with ETH to pay for tx fee
    if (
      faucet !== network.config.ethFaucetAddress &&
      faucetEthBalance.lt(oneEth)
    ) {
      // Fund faucet account with ETH
      const ethFaucet = network.config.ethFaucetAddress;
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ethFaucet],
      });
      const ethFaucetSigner = await ethers.provider.getSigner(ethFaucet);
      const ethSignerBalance = await ethFaucetSigner.getBalance();
      if (ethSignerBalance.lt(oneEth))
        throw Error(`ETH Faucet has insufficient DAI`);
      const ethTx = await ethFaucetSigner.sendTransaction({
        to: faucet,
        value: oneEth,
      });
      await ethTx.wait();
    }
  
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [faucet],
    });
  
    const faucetSigner = await ethers.provider.getSigner(faucet);
  
    const token = await ethers.getContractAt(
      "IERC20",
      network.config.daiAddress,
      faucetSigner
    );
  
    const signerBalance = await token.balanceOf(faucet);
    if (signerBalance.lt(amount))
      throw Error(`Faucet has insufficient DAI`);
  
    const tx = await token.connect(faucetSigner).transfer(recepient, amount);
    await tx.wait();
    const recepientBalance = await token.balanceOf(recepient);
    if (recepientBalance.lt(amount))
      throw Error(`Tranfer not succesfull`);
};