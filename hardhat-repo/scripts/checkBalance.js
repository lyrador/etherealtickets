const hre = require("hardhat");

async function main() {
    const accounts = await hre.ethers.getSigners();
    const provider = hre.ethers.provider;
  
    for (const account of accounts) {
        console.log(
            "%s (%i ETH)",
            account.address,
            hre.ethers.formatEther(
                // getBalance returns wei amount, format to ETH amount
                await provider.getBalance(account.address)
            )
        );
    }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });