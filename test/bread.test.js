const { ethers, deployments, network } = require("hardhat");
const { expect } = require("chai");
const { getDaiFromFaucet } = require("./helper");

const maxInt256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

describe("Bread test", async function () {
  let bread;
  let admin;
  let user;
  let adminAddress;
  let userAddress;
  let dai;
  let cDai;
  this.timeout(0);

  before(async function () {
    await deployments.fixture();
    [admin, user] = await ethers.getSigners();
    adminAddress = await admin.getAddress();
    userAddress = await user.getAddress();
    bread = await ethers.getContract("Bread");
    dai = await ethers.getContractAt("IERC20", network.config.daiAddress, admin);
    cDai = await ethers.getContractAt("ICERC20", network.config.cDaiAddress, user);
    console.log("    Contract address:", bread.address);
  });

  it("test mint tokens", async () => {
    const userAmount = 225000;
    await getDaiFromFaucet(userAddress, ethers.utils.parseEther(userAmount.toString()));

    console.log('    mint simulation:');
    const depositAmount = 100;
    const daiBalanceBefore = await dai.balanceOf(userAddress);
    await dai.connect(user).approve(bread.address, ethers.utils.parseEther(depositAmount.toString()));
    const balanceBefore = await bread.balanceOf(userAddress);
    await bread.connect(user).mint(ethers.utils.parseEther(depositAmount.toString()));
    const balanceAfter = await bread.balanceOf(userAddress);
    const daiBalanceAfter = await dai.balanceOf(userAddress);
    const daiBalanceChange = Number(ethers.utils.formatEther(daiBalanceBefore))-Number(ethers.utils.formatEther(daiBalanceAfter));
    const breadBalanceChange = Number(ethers.utils.formatEther(balanceAfter))-Number(ethers.utils.formatEther(balanceBefore));
    expect(daiBalanceChange.toFixed(3)).to.be.eq((depositAmount).toFixed(3));
    console.log(`    ${daiBalanceChange.toFixed(3)} DAI mints ${breadBalanceChange.toFixed(3)} BREAD`)
  });

  it("test interest accrues", async () => {
    // random user borrows dai and pays it back
    const userAmount = Number(ethers.utils.formatEther(await dai.balanceOf(userAddress)));
    await dai.connect(user).approve(network.config.cDaiAddress, ethers.utils.parseEther((userAmount/2).toString()));
    await cDai.mint(ethers.utils.parseEther((userAmount/2).toString()));
    expect((await dai.balanceOf(userAddress)).toString()).to.be.eq(ethers.utils.parseEther((userAmount/2).toString()).toString());
    await cDai.borrow(ethers.utils.parseEther((userAmount/4).toString()));
    expect((await dai.balanceOf(userAddress)).toString()).to.be.eq(ethers.utils.parseEther((userAmount*3/4).toString()).toString());
    for (let i = 0; i < 500; i++) {
      const block = await admin.provider.getBlock();
      const executionTime = block.timestamp + 15;
      await admin.provider.send('evm_mine', [executionTime]);
    }
    await dai.connect(user).approve(network.config.cDaiAddress, ethers.utils.parseEther("100000"));
    await cDai.repayBorrow(maxInt256);

    const resp = await bread.interestAvailable();
    console.log(`    interest (after 500 blocks): ${ethers.utils.formatEther(resp)} DAI`);
    expect(Number(ethers.utils.formatEther(resp))).to.be.gt(0);
  });

  it("test only treasury can withdraw interest", async () => {
    const resp = await bread.interestAvailable();
    const accrued = resp;
    try {
      await bread.connect(user).withdrawInterest(accrued);
      throw Error('user withdraw interest should be reverted');
    } catch(e) {
      console.log('    withdraw interest correctly permissioned');
    }
    const daiBalance = await dai.balanceOf(adminAddress);
    await bread.connect(admin).withdrawInterest(accrued);
    const daiChange = Number(ethers.utils.formatEther(await dai.balanceOf(adminAddress))) - Number(ethers.utils.formatEther(daiBalance));
    expect(daiChange.toFixed(4)).to.be.eq(Number(ethers.utils.formatEther(accrued)).toFixed(4));
  });

  it("test claim and withdraw COMP", async () => {
    const comptrollerAbi = ["function claimComp(address) external"];
    const comptroller = await ethers.getContractAt(comptrollerAbi, network.config.comptrollerAddress, user);
    await comptroller.claimComp(bread.address);
    const comp = await ethers.getContractAt("IERC20", network.config.compAddress);
    const bal = await comp.balanceOf(bread.address);
    expect(Number(bal.toString())).to.be.gt(0);
    try {
      await bread.connect(user).withdrawToken(network.config.compAddress, bal);
      throw Error('user withdraw interest should be reverted');
    } catch(e) {
      console.log("    withdawToken correctly permissioned")
    }
    await bread.connect(admin).withdrawToken(network.config.compAddress, bal);
    const bal2 = await comp.balanceOf(adminAddress);
    expect(Number(bal.toString())).to.be.eq(Number(bal2.toString()));
  });

  it("test withdraw ETH", async () => {
    await user.sendTransaction({
      to: bread.address,
      value: ethers.utils.parseEther("1"),
    })
    const bal = await admin.provider.getBalance(bread.address);
    const adminBal = await admin.provider.getBalance(adminAddress);
    try {
      await bread.connect(user).withdrawToken(network.config.ethAddress, bal);
      throw Error('user withdraw interest should be reverted');
    } catch(e) {
        console.log("    withdawToken correctly permissioned")
    }
    await bread.connect(admin).withdrawToken(network.config.ethAddress, bal);
    const bal2 = await admin.provider.getBalance(bread.address);
    const adminBal2 = await admin.provider.getBalance(adminAddress);
    expect(Number(ethers.utils.formatEther(bal2))).to.equal(0);
    expect(Number(ethers.utils.formatEther(adminBal2.sub(adminBal)))).to.be.gt(Number(ethers.utils.formatEther(bal))*0.9);
    expect(Number(ethers.utils.formatEther(adminBal2.sub(adminBal)))).to.be.lt(Number(ethers.utils.formatEther(bal)));
  });

  it("test burn tokens", async () => {
    const initialBalance = await dai.balanceOf(userAddress);
    const initialBread = await bread.balanceOf(userAddress);
    console.log('    burn simulation:');
    console.log(`    total supply before burn: ${ethers.utils.formatEther(await bread.totalSupply())} BREAD`);
    console.log(`    total DAI reserves: ${ethers.utils.formatEther(await bread.totalReserve())} DAI`);
    await bread.connect(user).burn(initialBread);
    const breadBurned = initialBread;
    const daiReceived = Number(ethers.utils.formatEther(await dai.balanceOf(userAddress))) - Number(ethers.utils.formatEther(initialBalance));
    expect(daiReceived).to.be.gt(0);
    console.log(`    Burn: ${ethers.utils.formatEther(breadBurned)} BREAD`);
    console.log(`    Receive: ${daiReceived} DAI`);
  });
});