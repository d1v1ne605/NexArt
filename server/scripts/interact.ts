import { ethers } from "ethers";
import { network } from "hardhat";
import * as readline from "readline";
import "dotenv/config";

// Contract addresses (deployed contracts)
const NFT_COLLECTION_FACTORY_ADDRESS =
  process.env.NFT_COLLECTION_FACTORY_ADDRESS as string;
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS as string;
const MARKETPLACE_FEE_MANAGER_ADDRESS =
  process.env.MARKETPLACE_FEE_MANAGER_ADDRESS as string;

// Global variables
let signer: any;
let nftCollectionFactory: any;
let marketplace: any;
let feeManager: any;
let rl: readline.Interface;

// Random data generators
const generateRandomName = (): string => {
  const adjectives = [
    "Mystic",
    "Golden",
    "Royal",
    "Eternal",
    "Legendary",
    "Sacred",
    "Ancient",
    "Divine",
  ];
  const nouns = [
    "Dragons",
    "Warriors",
    "Gems",
    "Artifacts",
    "Spirits",
    "Legends",
    "Tales",
    "Dreams",
  ];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]
    }`;
};

const generateRandomSymbol = (): string => {
  const symbols = ["MDG", "GWR", "RGM", "EAR", "LSP", "STL", "ADR", "DVT"];
  return symbols[Math.floor(Math.random() * symbols.length)];
};

const generateRandomDescription = (): string => {
  const descriptions = [
    "A unique collection of digital art pieces",
    "Exclusive NFTs with mystical powers",
    "Rare collectibles from another dimension",
    "Beautiful artworks created by AI",
    "Limited edition fantasy collection",
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const generateRandomPrice = (): string => {
  const prices = ["0.01", "0.05", "0.1", "0.25", "0.5", "1.0", "2.0"];
  return prices[Math.floor(Math.random() * prices.length)];
};

const generateRandomTokenCID = (): string => {
  const tokenCID = Math.floor(Math.random() * 10000) + 1;
  return tokenCID.toString();
};

// Utility functions
const displayHeader = () => {
  console.clear();
  console.log("═══════════════════════════════════════════");
  console.log("🎨 NexArt NFT Marketplace Console Interface");
  console.log("═══════════════════════════════════════════");
  console.log();
};

const waitForInput = (message: string = "Press Enter to continue...") => {
  return new Promise<void>((resolve) => {
    rl.question(message, () => {
      resolve();
    });
  });
};

const formatEther = (value: any): string => {
  return ethers.formatEther(value);
};

// Initialize contracts
async function initializeContracts() {
  console.log("🔄 Initializing contracts...");

  try {
    // Connect to network and get ethers
    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");

    // Get signer
    [signer] = await hreEthers.getSigners();
    console.log(`📍 Using account: ${signer.address}`);

    // Connect to contracts
    nftCollectionFactory = await hreEthers.getContractAt(
      "NFTCollectionFactory",
      NFT_COLLECTION_FACTORY_ADDRESS,
      signer
    );
    marketplace = await hreEthers.getContractAt(
      "Marketplace",
      MARKETPLACE_ADDRESS,
      signer
    );
    feeManager = await hreEthers.getContractAt(
      "MarketplaceFeeManager",
      MARKETPLACE_FEE_MANAGER_ADDRESS,
      signer
    );

    console.log("✅ Contracts initialized successfully!");

    // Display contract info
    const balance = await hreEthers.provider.getBalance(signer.address);
    console.log(`💰 Account balance: ${formatEther(balance)} ETH`);
  } catch (error) {
    console.error("❌ Error initializing contracts:", error);
    throw error;
  }
}

// Menu functions
async function showMainMenu() {
  displayHeader();
  console.log("📋 MAIN MENU");
  console.log("═══════════════════════════════════════════");
  console.log("1. 🏭 NFT Collection Factory Operations");
  console.log("2. 🎨 NFT Collection Operations");
  console.log("3. 🛒 Marketplace Operations");
  console.log("4. 💰 Fee Manager Operations");
  console.log("5. 📊 View Account Information");
  console.log("0. ❌ Exit");
  console.log("═══════════════════════════════════════════");

  const choice = await getUserInput("Enter your choice (0-5): ");

  switch (choice) {
    case "1":
      await showFactoryMenu();
      break;
    case "2":
      await showCollectionMenu();
      break;
    case "3":
      await showMarketplaceMenu();
      break;
    case "4":
      await showFeeManagerMenu();
      break;
    case "5":
      await showAccountInfo();
      break;
    case "0":
      console.log("👋 Goodbye!");
      return false;
    default:
      console.log("❌ Invalid choice. Please try again.");
      await waitForInput();
      break;
  }
  return true;
}

async function showFactoryMenu() {
  displayHeader();
  console.log("🏭 NFT COLLECTION FACTORY OPERATIONS");
  console.log("═══════════════════════════════════════════");
  console.log("1. 🆕 Create New Collection (Random Data)");
  console.log("2. 📋 View All Collections");
  console.log("3. 👤 View Creator Collections");
  console.log("4. 📊 View Factory Statistics");
  console.log("0. ⬅️  Back to Main Menu");
  console.log("═══════════════════════════════════════════");

  const choice = await getUserInput("Enter your choice (0-4): ");

  switch (choice) {
    case "1":
      await createRandomCollection();
      break;
    case "2":
      await viewAllCollections();
      break;
    case "3":
      await viewCreatorCollections();
      break;
    case "4":
      await viewFactoryStats();
      break;
    case "0":
      return;
    default:
      console.log("❌ Invalid choice. Please try again.");
      await waitForInput();
      break;
  }

  await showFactoryMenu();
}

async function showCollectionMenu() {
  displayHeader();
  console.log("🎨 NFT COLLECTION OPERATIONS");
  console.log("═══════════════════════════════════════════");
  console.log("1. 🎯 Mint NFT (Random Data)");
  console.log("2. 🔥 Batch Mint NFTs (Random Data)");
  console.log("3. 📊 View Collection Stats");
  console.log("4. 👑 View Token Info");
  console.log("5. 💰 Set Token Royalty");
  console.log("0. ⬅️  Back to Main Menu");
  console.log("═══════════════════════════════════════════");

  const choice = await getUserInput("Enter your choice (0-5): ");

  switch (choice) {
    case "1":
      await mintRandomNFT();
      break;
    case "2":
      await batchMintRandomNFTs();
      break;
    case "3":
      await viewCollectionStats();
      break;
    case "4":
      await viewTokenInfo();
      break;
    case "5":
      await setRandomTokenRoyalty();
      break;
    case "0":
      return;
    default:
      console.log("❌ Invalid choice. Please try again.");
      await waitForInput();
      break;
  }

  await showCollectionMenu();
}

async function showMarketplaceMenu() {
  displayHeader();
  console.log("🛒 MARKETPLACE OPERATIONS");
  console.log("═══════════════════════════════════════════");
  console.log("1. 🏷️  List NFT for Sale (Random Price)");
  console.log("2. 🛍️  Buy Listed NFT");
  console.log("3. ❌ Cancel Listing");
  console.log("4. 💰 Update Listing Price");
  console.log("5. 📋 View Active Listings");
  console.log("6. 👤 View My Listings");
  console.log("0. ⬅️  Back to Main Menu");
  console.log("═══════════════════════════════════════════");

  const choice = await getUserInput("Enter your choice (0-6): ");

  switch (choice) {
    case "1":
      await listNFTForSale();
      break;
    case "2":
      await buyListedNFT();
      break;
    case "3":
      await cancelListing();
      break;
    case "4":
      await updateListingPrice();
      break;
    case "5":
      await viewActiveListings();
      break;
    case "6":
      await viewMyListings();
      break;
    case "0":
      return;
    default:
      console.log("❌ Invalid choice. Please try again.");
      await waitForInput();
      break;
  }

  await showMarketplaceMenu();
}

async function showFeeManagerMenu() {
  displayHeader();
  console.log("💰 FEE MANAGER OPERATIONS");
  console.log("═══════════════════════════════════════════");
  console.log("1. 📊 View Fee Information");
  console.log("2. 🧮 Calculate Fee for Amount");
  console.log("3. 📈 View Fee Breakdown");
  console.log("0. ⬅️  Back to Main Menu");
  console.log("═══════════════════════════════════════════");

  const choice = await getUserInput("Enter your choice (0-3): ");

  switch (choice) {
    case "1":
      await viewFeeInfo();
      break;
    case "2":
      await calculateFee();
      break;
    case "3":
      await viewFeeBreakdown();
      break;
    case "0":
      return;
    default:
      console.log("❌ Invalid choice. Please try again.");
      await waitForInput();
      break;
  }

  await showFeeManagerMenu();
}

// Helper function to get user input
const getUserInput = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Main execution
async function main() {
  console.log("🚀 Starting NexArt NFT Marketplace Console Interface...");

  // Create readline interface
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await initializeContracts();
    await waitForInput("Press Enter to continue to main menu...");

    let continueRunning = true;
    while (continueRunning) {
      continueRunning = await showMainMenu();
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    rl.close();
  }
}

// Account info function
async function showAccountInfo() {
  displayHeader();
  console.log("📊 ACCOUNT INFORMATION");
  console.log("═══════════════════════════════════════════");

  try {
    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const balance = await hreEthers.provider.getBalance(signer.address);
    console.log(`📍 Address: ${signer.address}`);
    console.log(`💰 Balance: ${formatEther(balance)} ETH`);

    // Get network info
    const networkInfo = await hreEthers.provider.getNetwork();
    console.log(
      `🌐 Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`
    );

    // Get latest block
    const blockNumber = await hreEthers.provider.getBlockNumber();
    console.log(`📦 Latest Block: ${blockNumber}`);
  } catch (error) {
    console.error("❌ Error fetching account info:", error);
  }

  await waitForInput();
}

// Factory Operations
async function createRandomCollection() {
  displayHeader();
  console.log("🆕 CREATING NEW COLLECTION WITH RANDOM DATA");
  console.log("═══════════════════════════════════════════");

  try {
    const name = generateRandomName();
    const symbol = generateRandomSymbol();
    const description = generateRandomDescription();
    const baseURI = "https://api.nexart.com/collections/";
    const avatarCollection = `https://avatar.nexart.com/collections/${name}`;
    const maxSupply = Math.floor(Math.random() * 1000) + 100; // 100-1100

    console.log(`📝 Collection Details:`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Description: ${description}`);
    console.log(`   Avatar Collection: ${avatarCollection}`);
    console.log(`   Max Supply: ${maxSupply}`);
    console.log(`   Base URI: ${baseURI}`);

    const deploymentFee = await nftCollectionFactory.deploymentFee();
    console.log(`💰 Deployment Fee: ${formatEther(deploymentFee)} ETH`);

    console.log("\n🔄 Creating collection...");

    const params = {
      name,
      symbol,
      baseURI,
      maxSupply,
      description,
      avatarCollection,
    };

    const tx = await nftCollectionFactory.createCollection(params, {
      value: deploymentFee,
    });

    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      console.log("❌ Transaction failed!");
      return;
    }
    console.log("✅ Collection created successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);

    // Get the created collection address from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsedLog = nftCollectionFactory.interface.parseLog(log);
        return parsedLog?.name === "CollectionCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsedEvent = nftCollectionFactory.interface.parseLog(event);
      if (parsedEvent) {
        console.log(`🏭 Collection Address: ${parsedEvent.args.collection}`);
      }
    }
  } catch (error) {
    console.error("❌ Error creating collection:", error);
  }

  await waitForInput();
}

async function viewAllCollections() {
  displayHeader();
  console.log("📋 ALL COLLECTIONS");
  console.log("═══════════════════════════════════════════");

  try {
    const [collections, total] = await nftCollectionFactory.getAllCollections(
      0,
      10
    );

    console.log(`📊 Total Collections: ${total}`);
    console.log(`📄 Showing first 10 collections:\n`);

    for (let i = 0; i < collections.length; i++) {
      const collectionAddress = collections[i];
      const [isValid, creator, totalSupply] =
        await nftCollectionFactory.getCollectionInfo(collectionAddress);

      console.log(`${i + 1}. Collection: ${collectionAddress}`);
      console.log(`   Creator: ${creator}`);
      console.log(`   Total Supply: ${totalSupply}`);
      console.log(`   Valid: ${isValid ? "✅" : "❌"}`);
      console.log();
    }
  } catch (error) {
    console.error("❌ Error fetching collections:", error);
  }

  await waitForInput();
}

async function viewCreatorCollections() {
  displayHeader();
  console.log("👤 CREATOR COLLECTIONS");
  console.log("═══════════════════════════════════════════");

  try {
    const creatorAddress = await getUserInput(
      "Enter creator address (or press Enter for your address): "
    );
    const address = creatorAddress || signer.address;

    console.log(`\n📋 Collections created by: ${address}`);

    const collections = await nftCollectionFactory.getCreatorCollections(
      address
    );
    const totalCount = await nftCollectionFactory.getCreatorCollectionCount(
      address
    );

    console.log(`📊 Total Collections: ${totalCount}\n`);

    for (let i = 0; i < collections.length; i++) {
      const collectionAddress = collections[i];
      const [isValid, creator, totalSupply] =
        await nftCollectionFactory.getCollectionInfo(collectionAddress);

      console.log(`${i + 1}. Collection: ${collectionAddress}`);
      console.log(`   Total Supply: ${totalSupply}`);
      console.log(`   Valid: ${isValid ? "✅" : "❌"}`);
      console.log();
    }
  } catch (error) {
    console.error("❌ Error fetching creator collections:", error);
  }

  await waitForInput();
}

async function viewFactoryStats() {
  displayHeader();
  console.log("📊 FACTORY STATISTICS");
  console.log("═══════════════════════════════════════════");

  try {
    const totalCollections = await nftCollectionFactory.getTotalCollections();
    const deploymentFee = await nftCollectionFactory.deploymentFee();
    const feeRecipient = await nftCollectionFactory.feeRecipient();
    const maxCollectionsPerCreator =
      await nftCollectionFactory.maxCollectionsPerCreator();

    console.log(`📊 Total Collections Created: ${totalCollections}`);
    console.log(`💰 Deployment Fee: ${formatEther(deploymentFee)} ETH`);
    console.log(`🏦 Fee Recipient: ${feeRecipient}`);
    console.log(
      `📈 Max Collections Per Creator: ${maxCollectionsPerCreator === 0n ? "Unlimited" : maxCollectionsPerCreator
      }`
    );

    // Get your collection count
    const myCollectionCount =
      await nftCollectionFactory.getCreatorCollectionCount(signer.address);
    console.log(`👤 Your Collections: ${myCollectionCount}`);
  } catch (error) {
    console.error("❌ Error fetching factory stats:", error);
  }

  await waitForInput();
}

// Collection Operations
async function mintRandomNFT() {
  displayHeader();
  console.log("🎯 MINT NFT WITH RANDOM DATA");
  console.log("═══════════════════════════════════════════");

  try {
    const collectionAddress = await getUserInput(
      "Enter NFT Collection address: "
    );
    if (!collectionAddress) {
      console.log("❌ Collection address is required!");
      await waitForInput();
      return;
    }

    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const nftCollection = await hreEthers.getContractAt(
      "NFTCollection",
      collectionAddress,
      signer
    );

    const tokenCID = generateRandomTokenCID();
    const royaltyBps = Math.floor(Math.random() * 500); // 0-5%
    const recipient = signer.address;

    console.log(`🎨 Minting NFT:`);
    console.log(`   To: ${recipient}`);
    console.log(`   Token CID: ${tokenCID}`);
    console.log(`   Royalty: ${royaltyBps / 100}%`);

    console.log("\n🔄 Minting NFT...");

    const tx = await nftCollection.mintNFT(recipient, tokenCID, royaltyBps);
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      console.log("❌ Transaction failed!");
      return;
    }
    console.log("✅ NFT minted successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);

    // Get token ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsedLog = nftCollection.interface.parseLog(log);
        return parsedLog?.name === "TokenMinted";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsedEvent = nftCollection.interface.parseLog(event);
      if (parsedEvent) {
        console.log(`🆔 Token ID: ${parsedEvent.args.tokenId}`);
      }
    }
  } catch (error) {
    console.error("❌ Error minting NFT:", error);
  }

  await waitForInput();
}

async function batchMintRandomNFTs() {
  displayHeader();
  console.log("🔥 BATCH MINT NFTs WITH RANDOM DATA");
  console.log("═══════════════════════════════════════════");

  try {
    const collectionAddress = await getUserInput(
      "Enter NFT Collection address: "
    );
    if (!collectionAddress) {
      console.log("❌ Collection address is required!");
      await waitForInput();
      return;
    }

    const quantityStr = await getUserInput("Enter quantity to mint (1-5): ");
    const quantity = Math.min(Math.max(parseInt(quantityStr) || 3, 1), 5);

    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const nftCollection = await hreEthers.getContractAt(
      "NFTCollection",
      collectionAddress,
      signer
    );

    const tokenCIDs = [];
    for (let i = 0; i < quantity; i++) {
      tokenCIDs.push(generateRandomTokenCID());
    }

    const royaltyBps = Math.floor(Math.random() * 500); // 0-5%
    const recipient = signer.address;

    console.log(`🎨 Batch Minting ${quantity} NFTs:`);
    console.log(`   To: ${recipient}`);
    console.log(`   Royalty: ${royaltyBps / 100}%`);
    console.log(`   Token CIDs:`);
    tokenCIDs.forEach((cid, i) => console.log(`     ${i + 1}. ${cid}`));

    console.log("\n🔄 Batch minting NFTs...");

    const tx = await nftCollection.batchMintNFT(
      recipient,
      tokenCIDs,
      royaltyBps
    );
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      console.log("❌ Transaction failed!");
      return;
    }
    console.log("✅ NFTs minted successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);
  } catch (error) {
    console.error("❌ Error batch minting NFTs:", error);
  }

  await waitForInput();
}

async function viewCollectionStats() {
  displayHeader();
  console.log("📊 COLLECTION STATISTICS");
  console.log("═══════════════════════════════════════════");

  try {
    const collectionAddress = await getUserInput(
      "Enter NFT Collection address: "
    );
    if (!collectionAddress) {
      console.log("❌ Collection address is required!");
      await waitForInput();
      return;
    }

    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const nftCollection = await hreEthers.getContractAt(
      "NFTCollection",
      collectionAddress,
      signer
    );

    const [
      totalSupply,
      totalMinted,
      maxSupply,
      creator,
      avatarCollection,
      description,
      externalUrl
    ] = await nftCollection.getCollectionStats();
    const name = await nftCollection.name();
    const symbol = await nftCollection.symbol();

    console.log(`📊 Collection: ${name} (${symbol})`);
    console.log(`📍 Address: ${collectionAddress}`);
    console.log(`👤 Creator: ${creator}`);
    console.log(`👤 Avatar Collection: ${avatarCollection}`);
    console.log(`📝 Description: ${description}`);
    console.log(`🔗 External URL: ${externalUrl}`);
    console.log(`📈 Total Supply: ${totalSupply}`);
    console.log(`🎨 Total Minted: ${totalMinted}`);
    console.log(`🎯 Max Supply: ${maxSupply === 0n ? "Unlimited" : maxSupply}`);
  } catch (error) {
    console.error("❌ Error fetching collection stats:", error);
  }

  await waitForInput();
}

async function viewTokenInfo() {
  displayHeader();
  console.log("👑 TOKEN INFORMATION");
  console.log("═══════════════════════════════════════════");

  try {
    const collectionAddress = await getUserInput(
      "Enter NFT Collection address: "
    );
    if (!collectionAddress) {
      console.log("❌ Collection address is required!");
      await waitForInput();
      return;
    }

    const tokenIdStr = await getUserInput("Enter Token ID: ");
    const tokenId = parseInt(tokenIdStr);
    if (isNaN(tokenId)) {
      console.log("❌ Invalid token ID!");
      await waitForInput();
      return;
    }

    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const nftCollection = await hreEthers.getContractAt(
      "NFTCollection",
      collectionAddress,
      signer
    );

    const owner = await nftCollection.ownerOf(tokenId);
    const tokenURI = await nftCollection.tokenURI(tokenId);
    const [creator, royaltyBps] = await nftCollection.getTokenRoyalty(tokenId);

    console.log(`🆔 Token ID: ${tokenId}`);
    console.log(`👤 Owner: ${owner}`);
    console.log(`🎨 Creator: ${creator}`);
    console.log(`🔗 Token URI: ${tokenURI}`);
    console.log(`💰 Royalty: ${Number(royaltyBps) / 100}%`);
  } catch (error) {
    console.error("❌ Error fetching token info:", error);
  }

  await waitForInput();
}

async function setRandomTokenRoyalty() {
  displayHeader();
  console.log("💰 SET TOKEN ROYALTY");
  console.log("═══════════════════════════════════════════");

  try {
    const collectionAddress = await getUserInput(
      "Enter NFT Collection address: "
    );
    if (!collectionAddress) {
      console.log("❌ Collection address is required!");
      await waitForInput();
      return;
    }

    const tokenIdStr = await getUserInput("Enter Token ID: ");
    const tokenId = parseInt(tokenIdStr);
    if (isNaN(tokenId)) {
      console.log("❌ Invalid token ID!");
      await waitForInput();
      return;
    }

    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const nftCollection = await hreEthers.getContractAt(
      "NFTCollection",
      collectionAddress,
      signer
    );

    const royaltyBps = Math.floor(Math.random() * 500); // 0-5%

    console.log(`💰 Setting royalty for token ${tokenId}:`);
    console.log(`   New Royalty: ${royaltyBps / 100}%`);

    console.log("\n🔄 Setting royalty...");

    const tx = await nftCollection.setTokenRoyalty(tokenId, royaltyBps);
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      console.log("❌ Transaction failed!");
      return;
    }
    console.log("✅ Royalty set successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);
  } catch (error) {
    console.error("❌ Error setting royalty:", error);
  }

  await waitForInput();
}

// Marketplace Operations
async function listNFTForSale() {
  displayHeader();
  console.log("🏷️ LIST NFT FOR SALE WITH RANDOM PRICE");
  console.log("═══════════════════════════════════════════");

  try {
    const nftContractAddress = await getUserInput(
      "Enter NFT Collection address: "
    );
    if (!nftContractAddress) {
      console.log("❌ NFT Contract address is required!");
      await waitForInput();
      return;
    }

    const tokenIdStr = await getUserInput("Enter Token ID: ");
    const tokenId = parseInt(tokenIdStr);
    if (isNaN(tokenId)) {
      console.log("❌ Invalid token ID!");
      await waitForInput();
      return;
    }

    const { ethers: hreEthers } = await network.connect(process.env.NETWORK || "");
    const nftCollection = await hreEthers.getContractAt(
      "NFTCollection",
      nftContractAddress,
      signer
    );

    // Kiểm tra owner
    const owner = await nftCollection.ownerOf(tokenId);
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ You are not the owner of this token!");
      await waitForInput();
      return;
    }

    // Kiểm tra approve
    const isApproved = await nftCollection.isApprovedForAll(
      signer.address,
      MARKETPLACE_ADDRESS
    );
    if (!isApproved) {
      console.log("🔑 Approving marketplace to transfer your NFTs...");
      const approveTx = await nftCollection.setApprovalForAll(
        MARKETPLACE_ADDRESS,
        true
      );
      await approveTx.wait();
      console.log("✅ Marketplace approved!");
    }

    const price = ethers.parseEther(generateRandomPrice());
    const paymentToken = "0x0000000000000000000000000000000000000000"; // ETH

    console.log(`🏷️ Listing Details:`);
    console.log(`   NFT Contract: ${nftContractAddress}`);
    console.log(`   Token ID: ${tokenId}`);
    console.log(`   Price: ${formatEther(price)} ETH`);
    console.log(`   Payment Token: ETH`);

    console.log("\n🔄 Listing NFT...");

    const tx = await marketplace.listItem(
      nftContractAddress,
      tokenId,
      price,
      paymentToken
    );
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      console.log("❌ Transaction failed!");
      return;
    }
    console.log("✅ NFT listed successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);

    // Get listing ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsedLog = marketplace.interface.parseLog(log);
        return parsedLog?.name === "ItemListed";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsedEvent = marketplace.interface.parseLog(event);
      if (parsedEvent) {
        console.log(`🆔 Listing ID: ${parsedEvent.args.listingId}`);
      }
    }
  } catch (error) {
    console.error("❌ Error listing NFT:", error);
  }

  await waitForInput();
}

async function buyListedNFT() {
  displayHeader();
  console.log("🛍️ BUY LISTED NFT");
  console.log("═══════════════════════════════════════════");

  try {
    const listingId = await getUserInput("Enter Listing ID: ");
    if (!listingId) {
      console.log("❌ Listing ID is required!");
      await waitForInput();
      return;
    }

    // Get listing details first
    const listing = await marketplace.getListing(listingId);

    if (!listing.isActive) {
      console.log("❌ Listing is not active!");
      await waitForInput();
      return;
    }

    console.log(`🛍️ Buying NFT:`);
    console.log(`   NFT Contract: ${listing.nftContract}`);
    console.log(`   Token ID: ${listing.tokenId}`);
    console.log(`   Price: ${formatEther(listing.price)} ETH`);
    console.log(`   Seller: ${listing.seller}`);

    console.log("\n🔄 Buying NFT...");

    const tx = await marketplace.buyItem(listingId, {
      value: listing.price,
    });
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    if (!receipt) {
      console.log("❌ Transaction failed!");
      return;
    }
    console.log("✅ NFT purchased successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);
  } catch (error) {
    console.error("❌ Error buying NFT:", error);
  }

  await waitForInput();
}

async function cancelListing() {
  displayHeader();
  console.log("❌ CANCEL LISTING");
  console.log("═══════════════════════════════════════════");

  try {
    const listingId = await getUserInput("Enter Listing ID: ");
    if (!listingId) {
      console.log("❌ Listing ID is required!");
      await waitForInput();
      return;
    }

    // Get listing details first
    const listing = await marketplace.getListing(listingId);

    if (!listing.isActive) {
      console.log("❌ Listing is not active!");
      await waitForInput();
      return;
    }

    console.log(`❌ Cancelling listing:`);
    console.log(`   NFT Contract: ${listing.nftContract}`);
    console.log(`   Token ID: ${listing.tokenId}`);
    console.log(`   Price: ${formatEther(listing.price)} ETH`);

    console.log("\n🔄 Cancelling listing...");

    const tx = await marketplace.cancelListing(listingId);
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Listing cancelled successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);
  } catch (error) {
    console.error("❌ Error cancelling listing:", error);
  }

  await waitForInput();
}

async function updateListingPrice() {
  displayHeader();
  console.log("💰 UPDATE LISTING PRICE");
  console.log("═══════════════════════════════════════════");

  try {
    const listingId = await getUserInput("Enter Listing ID: ");
    if (!listingId) {
      console.log("❌ Listing ID is required!");
      await waitForInput();
      return;
    }

    // Get listing details first
    const listing = await marketplace.getListing(listingId);

    if (!listing.isActive) {
      console.log("❌ Listing is not active!");
      await waitForInput();
      return;
    }

    const newPrice = ethers.parseEther(generateRandomPrice());

    console.log(`💰 Updating listing price:`);
    console.log(`   Current Price: ${formatEther(listing.price)} ETH`);
    console.log(`   New Price: ${formatEther(newPrice)} ETH`);

    console.log("\n🔄 Updating price...");

    const tx = await marketplace.updateListingPrice(listingId, newPrice);
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Price updated successfully!");
    console.log(`⛽ Gas Used: ${receipt.gasUsed}`);
  } catch (error) {
    console.error("❌ Error updating price:", error);
  }

  await waitForInput();
}

async function viewActiveListings() {
  displayHeader();
  console.log("📋 ACTIVE LISTINGS");
  console.log("═══════════════════════════════════════════");

  try {
    const [listingIds, total] = await marketplace.getActiveListings(0, 10);

    console.log(`📊 Total Active Listings: ${total}`);
    console.log(`📄 Showing first 10 listings:\n`);

    for (let i = 0; i < listingIds.length; i++) {
      const listingId = listingIds[i];
      const listing = await marketplace.getListing(listingId);

      console.log(`${i + 1}. Listing ID: ${listingId}`);
      console.log(`   NFT Contract: ${listing.nftContract}`);
      console.log(`   Token ID: ${listing.tokenId}`);
      console.log(`   Price: ${formatEther(listing.price)} ETH`);
      console.log(`   Seller: ${listing.seller}`);
      console.log(`   Active: ${listing.isActive ? "✅" : "❌"}`);
      console.log();
    }
  } catch (error) {
    console.error("❌ Error fetching active listings:", error);
  }

  await waitForInput();
}

async function viewMyListings() {
  displayHeader();
  console.log("👤 MY LISTINGS");
  console.log("═══════════════════════════════════════════");

  try {
    const myListings = await marketplace.getSellerListings(signer.address);

    console.log(`📊 Your Total Listings: ${myListings.length}\n`);

    for (let i = 0; i < myListings.length; i++) {
      const listingId = myListings[i];
      const listing = await marketplace.getListing(listingId);

      console.log(`${i + 1}. Listing ID: ${listingId}`);
      console.log(`   NFT Contract: ${listing.nftContract}`);
      console.log(`   Token ID: ${listing.tokenId}`);
      console.log(`   Price: ${formatEther(listing.price)} ETH`);
      console.log(`   Active: ${listing.isActive ? "✅" : "❌"}`);
      console.log();
    }
  } catch (error) {
    console.error("❌ Error fetching your listings:", error);
  }

  await waitForInput();
}

// Fee Manager Operations
async function viewFeeInfo() {
  displayHeader();
  console.log("📊 FEE INFORMATION");
  console.log("═══════════════════════════════════════════");

  try {
    const [feeBps, recipient, minFee] = await feeManager.getFeeInfo();
    const maxFee = await feeManager.MAX_FEE_BPS();

    console.log(`💰 Current Fee: ${feeBps / 100}% (${feeBps} basis points)`);
    console.log(`🏦 Fee Recipient: ${recipient}`);
    console.log(`💎 Minimum Fee: ${formatEther(minFee)} ETH`);
    console.log(`🎯 Maximum Fee: ${maxFee / 100}% (${maxFee} basis points)`);
  } catch (error) {
    console.error("❌ Error fetching fee info:", error);
  }

  await waitForInput();
}

async function calculateFee() {
  displayHeader();
  console.log("🧮 CALCULATE FEE FOR AMOUNT");
  console.log("═══════════════════════════════════════════");

  try {
    const amountStr = await getUserInput("Enter sale amount in ETH: ");
    const amount = ethers.parseEther(amountStr || "1.0");

    const marketFee = await feeManager.calculateMarketFee(amount);

    console.log(`💰 Sale Amount: ${formatEther(amount)} ETH`);
    console.log(`🏦 Market Fee: ${formatEther(marketFee)} ETH`);
    console.log(`👤 Seller Receives: ${formatEther(amount - marketFee)} ETH`);
  } catch (error) {
    console.error("❌ Error calculating fee:", error);
  }

  await waitForInput();
}

async function viewFeeBreakdown() {
  displayHeader();
  console.log("📈 FEE BREAKDOWN");
  console.log("═══════════════════════════════════════════");

  try {
    const amountStr = await getUserInput("Enter sale amount in ETH: ");
    const amount = ethers.parseEther(amountStr || "1.0");

    const [marketFee, sellerAmount] = await feeManager.calculateFeeBreakdown(
      amount
    );
    const [feeBps] = await feeManager.getFeeInfo();

    console.log(`💰 Sale Amount: ${formatEther(amount)} ETH`);
    console.log(`📊 Fee Percentage: ${feeBps / 100}%`);
    console.log(`🏦 Market Fee: ${formatEther(marketFee)} ETH`);
    console.log(`👤 Seller Amount: ${formatEther(sellerAmount)} ETH`);
    console.log(
      `📈 Fee Ratio: ${((Number(marketFee) / Number(amount)) * 100).toFixed(
        2
      )}%`
    );
  } catch (error) {
    console.error("❌ Error calculating fee breakdown:", error);
  }

  await waitForInput();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
