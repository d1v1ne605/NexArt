import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import { configVariable } from "hardhat/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatNetworkHelpers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "london",
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      testing: {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    ganache: {
      type: "http",
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: [
        // "0x2f92d1e2a91ab0b823e6f501adbbfdac239971082cb55e1306592fc98fb0c801",
        // "0x2bca502a0bf12cb9ae2412a3a4d5664e12e0a69f0c2cbe4f179a2f550c5d490c",
      ],
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
  ignition: {
    blockPollingInterval: 1000,
    timeBeforeBumpingFees: 180 * 1000,
    maxFeeBumps: 4,
    requiredConfirmations: 1,
  },
};

export default config;
