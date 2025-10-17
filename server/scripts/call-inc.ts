import { network } from "hardhat";
import "dotenv/config";
const { ethers } = await network.connect(process.env.NETWORK || "");

async function main() {
  const CONTRACT_ADDRESS = "0x8aB215541656867Fd7c2689060E17E8A73bb44D2";
  const counter = await ethers.getContractAt("Counter", CONTRACT_ADDRESS);

  console.log(`Current value of x: ${await counter.x()}`);

  console.log("Calling incBy(10)...");
  const tx = await counter.incBy(5);
  await tx.wait();

  console.log("Transaction confirmed!");
  console.log(`New value of x: ${await counter.x()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});