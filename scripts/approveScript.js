const { ethers, network } = require('hardhat');

const approve = async (admin, tokenAddress, approveAddress, amount) => {
    const c = await ethers.getContractAt(["function approve(address,uint256) external"], tokenAddress, admin);
    tx = await c.approve(approveAddress, amount);
    console.log(tx.hash);
}


(async () => {
    const [admin] = await ethers.getSigners();
    const tokAddr = network.config.daiAddress;
    const approveAddr = "0x337efDA1a91a14715a38Cc193Cd4b0d6415b9448";
    const amount = ethers.utils.parseEther("100");
    await approve(admin, tokAddr, approveAddr, amount);
})();