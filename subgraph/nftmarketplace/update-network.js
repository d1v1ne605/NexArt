require("dotenv").config();
const fs = require("fs");
const path = require("path");

const CONTRACT_NAMES = [
  "MarketplaceFeeManager",
  "NFTCollectionFactory",
  "Marketplace",
];

/**
 * @dev Updates networks.json from environment variables
 */
function updateNetworkJson() {
  const networks = {
    localhost: {
      MarketplaceFeeManager: {
        address: process.env.MARKETPLACE_FEE_MANAGER_ADDRESS,
        startBlock: parseInt(process.env.MARKETPLACE_FEE_MANAGER_BLOCK) || 0,
      },
      NFTCollectionFactory: {
        address: process.env.NFT_COLLECTION_FACTORY_ADDRESS,
        startBlock: parseInt(process.env.NFT_COLLECTION_FACTORY_BLOCK) || 0,
      },
      Marketplace: {
        address: process.env.MARKETPLACE_ADDRESS,
        startBlock: parseInt(process.env.MARKETPLACE_BLOCK) || 0,
      },
    },
  };
  // Validate all addresses are present
  for (const [contractName, config] of Object.entries(networks.localhost)) {
    if (!config.address) {
      throw new Error(`Missing address for ${contractName}`);
    }
  }

  const networksPath = path.join(__dirname, "networks.json");
  fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
  console.log("✅ Generated networks.json from environment variables");
}

/**
 * @dev Copies complete artifact files from server to subgraph abis directory
 */
function copyABIs() {
  const serverArtifactsPath = path.join(
    __dirname,
    "../../server/artifacts/contracts",
  );
  const subgraphAbisPath = path.join(__dirname, "abis");

  // Ensure abis directory exists
  if (!fs.existsSync(subgraphAbisPath)) {
    fs.mkdirSync(subgraphAbisPath, { recursive: true });
  }

  let copiedCount = 0;

  for (const contractName of CONTRACT_NAMES) {
    try {
      // Hardhat artifacts path: contracts/ContractName.sol/ContractName.json
      const artifactPath = path.join(
        serverArtifactsPath,
        `${contractName}.sol`,
        `${contractName}.json`,
      );

      if (!fs.existsSync(artifactPath)) {
        console.warn(`⚠️  Artifact not found: ${artifactPath}`);
        continue;
      }

      // Read the complete artifact
      const artifactContent = fs.readFileSync(artifactPath, "utf8");
      const artifact = JSON.parse(artifactContent);

      if (!artifact.abi || !artifact.bytecode) {
        throw new Error(`Invalid artifact structure for ${contractName}`);
      }

      // Copy the entire artifact file to subgraph abis directory
      const abiPath = path.join(subgraphAbisPath, `${contractName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(artifact, null, 2));

      console.log(`✅ Copied complete artifact for ${contractName}`);
      copiedCount++;
    } catch (error) {
      console.error(
        `❌ Failed to copy artifact for ${contractName}:`,
        error.message,
      );
    }
  }

  if (copiedCount === 0) {
    throw new Error(
      "No artifact files were copied. Ensure contracts are compiled.",
    );
  }

  console.log(
    `🎉 Successfully copied ${copiedCount}/${CONTRACT_NAMES.length} complete artifacts`,
  );
}

function main() {
  try {
    console.log("🚀 Starting subgraph configuration update...\n");

    updateNetworkJson();
    copyABIs();

    console.log("\n✨ Subgraph configuration updated successfully!");
    console.log("📁 Files update success:");
    console.log("   - networks.json (contract addresses & start blocks)");
    console.log("   - abis/*.json (complete Hardhat artifacts)");
  } catch (error) {
    console.error("💥 Configuration update failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateNetworkJson, copyABIs, main };
