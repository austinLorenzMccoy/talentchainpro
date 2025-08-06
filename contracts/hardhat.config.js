require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("dotenv").config();

// Hedera network configuration
const HEDERA_NETWORKS = {
  testnet: {
    url: "https://testnet.hashio.io/api",
    accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
    chainId: 296,
    gasPrice: "auto",
    gasMultiplier: 1.2,
  },
  mainnet: {
    url: "https://mainnet.hashio.io/api",
    accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
    chainId: 295,
    gasPrice: "auto",
    gasMultiplier: 1.1,
  },
  previewnet: {
    url: "https://previewnet.hashio.io/api",
    accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
    chainId: 297,
    gasPrice: "auto",
    gasMultiplier: 1.3,
  }
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "evm.methodIdentifiers"]
        }
      }
    },
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      mining: {
        auto: true,
        interval: 1000
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Hedera networks
    ...HEDERA_NETWORKS
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache", 
    artifacts: "./artifacts"
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 20,
    showTimeSpent: true,
    showMethodSig: true,
    maxMethodDiff: 10,
  },
  
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  
  mocha: {
    timeout: 60000,
    bail: false,
  },
  
  etherscan: {
    apiKey: {
      // Note: Hedera doesn't use Etherscan but we keep this for compatibility
      testnet: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "hedera-testnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.mirrornode.hedera.com",
          browserURL: "https://hashscan.io/testnet"
        }
      },
      {
        network: "hedera-mainnet", 
        chainId: 295,
        urls: {
          apiURL: "https://mainnet-public.mirrornode.hedera.com",
          browserURL: "https://hashscan.io/mainnet"
        }
      }
    ]
  },
  
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
    externalArtifacts: [],
  },
  
  // Custom settings for Hedera optimization
  hedera: {
    network: process.env.HEDERA_NETWORK || "testnet",
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    maxTransactionFee: "20", // HBAR
    maxQueryPayment: "1",   // HBAR
  }
};