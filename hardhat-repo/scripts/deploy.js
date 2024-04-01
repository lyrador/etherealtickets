// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const unlockTime = currentTimestampInSeconds + 60;
  // const lockedAmount = hre.ethers.parseEther("0.001");
  // const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
  //   value: lockedAmount,
  // });
  //  await lock.waitForDeployment();
  // console.log(
  //   `Lock with ${ethers.formatEther(
  //     lockedAmount
  //   )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
  // );

  const concert = await hre.ethers.deployContract("Concert");
  await concert.waitForDeployment();
  const ticket = await hre.ethers.deployContract("Ticket", [concert.target]);
  await ticket.waitForDeployment();
  const marketplace = await hre.ethers.deployContract("Marketplace", [
    concert.target,
    ticket.target,
    "EtherealTickets",
    "ET",
  ]);
  await marketplace.waitForDeployment();
  const secondaryMarketPlace = await hre.ethers.deployContract(
    "SecondaryMarketplace",
    [concert.target, ticket.target, marketplace.target]
  );
  await secondaryMarketPlace.waitForDeployment();

  console.log(`Concert contract deployed to ${concert.target}`);
  console.log(`Ticket contract deployed to ${ticket.target}`);
  console.log(`Marketplace contract deployed to ${marketplace.target}`);
  console.log(
    `SecondaryMarketplace contract deployed to ${secondaryMarketPlace.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
