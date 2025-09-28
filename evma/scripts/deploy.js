const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Chainlink Functions router address for Sepolia
  const router = "0xc6e2a4e6e0e7f5cc1f3c5e9c2c3b7e5a2fd8e3e4";

  const ArtVerifier = await hre.ethers.getContractFactory("ArtVerifier");
  const contract = await ArtVerifier.deploy(router);

  console.log("ArtVerifier deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
