const { ethers, network, deployments } = require('hardhat');

const approve = async (admin, tokenAddress, approveAddress, amount) => {
    const c = await ethers.getContractAt(["function approve(address,uint256) external"], tokenAddress, admin);
    tx = await c.approve(approveAddress, amount);
    console.log(tx.hash);
}


(async () => {
    const [admin] = await ethers.getSigners();
    const tokAddr = network.config.daiAddress;
    const approveAddr = (await deployments.get("Yeast")).address;
    const amount = ethers.utils.parseEther("100");
    await approve(admin, tokAddr, approveAddr, amount);
})();