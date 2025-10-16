import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTMarketplaceModule = buildModule("NFTMarketplaceModule", (m) => {
  // Deploy MarketplaceFeeManager first
  const initialOwner = m.getAccount(0);
  const initialFeeBps = 250; // 2.5% fee
  const initialFeeRecipient = m.getAccount(0); // Owner receives fees initially
  const initialMinimumFee = 1000000000000000n; // 0.001 ETH minimum fee

  const feeManager = m.contract("MarketplaceFeeManager", [
    initialOwner,
    initialFeeBps,
    initialFeeRecipient,
    initialMinimumFee,
  ]);

  // Deploy NFTCollectionFactory
  const deploymentFee = 10000000000000000n; // 0.01 ETH deployment fee
  const factoryFeeRecipient = m.getAccount(0);

  const nftFactory = m.contract("NFTCollectionFactory", [
    initialOwner,
    deploymentFee,
    factoryFeeRecipient,
  ]);

  // Deploy Marketplace
  const minimumListingPrice = 1000000000000000n; // 0.001 ETH minimum listing price

  const marketplace = m.contract("Marketplace", [
    initialOwner,
    feeManager,
    minimumListingPrice,
  ]);

  return {
    feeManager,
    nftFactory,
    marketplace,
  };
});

export default NFTMarketplaceModule;