
const { ethers, network } = require('hardhat');

const getDai = async (admin, tokenAddress) => {
    const c = await ethers.getContractAt(["function allocateTo(address recipient, uint256 value) external"], tokenAddress, admin);
    tx = await c.allocateTo(await admin.getAddress(), ethers.utils.parseEther("100"));
    console.log(tx.hash);
}


(async () => {
    const [admin] = await ethers.getSigners();
    const tokAddr = network.config.daiAddress;
    await getDai(admin, tokAddr);
})();