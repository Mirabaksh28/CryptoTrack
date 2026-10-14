import hre from "hardhat";

const { ethers } = await hre.network.connect();

const cryptoTrack = await ethers.deployContract("CryptoTrack");

await cryptoTrack.waitForDeployment();

console.log("CryptoTrack deployed to:", await cryptoTrack.getAddress());