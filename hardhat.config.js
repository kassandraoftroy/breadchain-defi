// Hardhat
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

// Libraries
const assert = require("assert");
const { utils } = require("ethers");

require("dotenv").config();

// @dev Put this in .env
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

// @dev fill this out
const DEPLOYER_MAINNET = "";
const DEPLOYER_PK_MAINNET = process.env.DEPLOYER_PK_MAINNET;
const DEPLOYER_RINKEBY = "";
const DEPLOYER_PK_RINKEBY = process.env.DEPLOYER_PK_RINKEBY;

const mainnetAddresses = {
  ethAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  daiAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  cDaiAddress: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
  cEthAddress: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
  compAddress: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
  comptrollerAddress: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
  daiFaucetAddress: "0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667",
  ethFaucetAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
};

const rinkebyAddresses = {
  cDaiAddress: '0x6D7F0754FFeb405d23C51CE938289d4835bE3b14',
  daiAddress: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  wethAddress: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
};

module.exports = {
  defaultNetwork: "hardhat",
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    maxMethodDiff: 25,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  // hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
      mainnet: DEPLOYER_MAINNET,
      rinkeby: DEPLOYER_RINKEBY,
    },
  },
  networks: {
    hardhat: {
      // Standard config
      // timeout: 150000,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        blockNumber: 12780870,
      },
      ...mainnetAddresses,
    },

    mainnet: {
      accounts: DEPLOYER_PK_MAINNET ? [DEPLOYER_PK_MAINNET] : [],
      chainId: 1,
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("1", "gwei")),
      ...mainnetAddresses,
    },

    rinkeby: {
      accounts: DEPLOYER_PK_RINKEBY ? [DEPLOYER_PK_RINKEBY] : [],
      chainId: 4,
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_ID}`,
      gasPrice: parseInt(utils.parseUnits("2", "gwei")),
      ...rinkebyAddresses,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.4.25",
        settings: {
          optimizer: { enabled: process.env.DEBUG ? false : true },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: { enabled: process.env.DEBUG ? false : true },
        },
      },
      // {
      //   version: "0.7.4",
      //   settings: {
      //     optimizer: { enabled: process.env.DEBUG ? false : true },
      //   },
      // },
    ],
  },
};
