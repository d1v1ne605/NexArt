import { network } from "hardhat";
const { ethers } = await network.connect("ganache");

/**
 * @notice Deploys the NFT Marketplace system contracts in correct order.
 * @dev Follows the same logic as the Ignition module, but as a standard deploy script.
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  // --- Deploy MarketplaceFeeManager ---
  const initialFeeBps = 250; // 2.5%
  const initialMinimumFee = ethers.parseEther("0.001"); // 0.001 ETH
  const MarketplaceFeeManager = await ethers.getContractFactory("MarketplaceFeeManager");
  const feeManager = await MarketplaceFeeManager.deploy(
    deployer.address,
    initialFeeBps,
    deployer.address,
    initialMinimumFee
  );
  await feeManager.waitForDeployment();
  console.log("MarketplaceFeeManager deployed at:", await feeManager.getAddress());

  // --- Deploy NFTCollectionFactory ---
  const deploymentFee = ethers.parseEther("0.01"); // 0.01 ETH
  const NFTCollectionFactory = await ethers.getContractFactory("NFTCollectionFactory");
  const nftFactory = await NFTCollectionFactory.deploy(
    deployer.address,
    deploymentFee,
    deployer.address
  );
  await nftFactory.waitForDeployment();
  console.log("NFTCollectionFactory deployed at:", await nftFactory.getAddress());

  // --- Deploy Marketplace ---
  const minimumListingPrice = ethers.parseEther("0.001"); // 0.001 ETH
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    deployer.address,
    await feeManager.getAddress(),
    minimumListingPrice
  );
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed at:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});