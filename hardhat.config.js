require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Verify that environment variables are loaded correctly
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

// Check if keys are available
if (!PRIVATE_KEY || !ALCHEMY_API_KEY) {
  console.error("Missing PRIVATE_KEY or ALCHEMY_API_KEY in .env file");
}

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  },
  paths: {
    artifacts: "./src/artifacts",
  }
};