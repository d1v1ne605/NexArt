import { network } from "hardhat";
import "dotenv/config";
const { ethers } = await network.connect(process.env.NETWORK || "");

async function main() {
  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();

  await counter.waitForDeployment();
  console.log("Counter deployed to:", await counter.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});