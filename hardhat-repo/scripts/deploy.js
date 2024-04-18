// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");
const fse = require("fs-extra");
let secondaryMarketplaceAddr = "";

async function updateAddressFile(
  concertAddress,
  ticketAddress,
  marketplaceAddress,
  secondaryMarketplaceAddress
) {
  const content = `
export const ORGANIZER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
export const CONCERT = "${concertAddress}";
export const TICKET = "${ticketAddress}";
export const MARKETPLACE = "${marketplaceAddress}";
export const SECONDARY_MARKETPLACE = "${secondaryMarketplaceAddress}";
`;
  secondaryMarketplaceAddr = secondaryMarketplaceAddress;
  fs.writeFileSync("../react-repo/src/constants/Address.js", content);
  console.log("Address file updated successfully!");
}

// Function to copy contract artifact
async function copyConcertArtifact() {
  const sourcePath = "./artifacts/contracts/Concert.sol/Concert.json";
  const destinationPath = "../react-repo/src/contracts/Concert.json";
  await fse.copy(sourcePath, destinationPath);
}

async function copyTicketArtifact() {
  const sourcePath = "./artifacts/contracts/Ticket.sol/Ticket.json";
  const destinationPath = "../react-repo/src/contracts/Ticket.json";
  await fse.copy(sourcePath, destinationPath);
}

async function copyMarketplaceArtifact() {
  const sourcePath = "./artifacts/contracts/Marketplace.sol/Marketplace.json";
  const destinationPath = "../react-repo/src/contracts/Marketplace.json";
  await fse.copy(sourcePath, destinationPath);
}

async function copySecondaryMarketplaceArtifact() {
  const sourcePath =
    "./artifacts/contracts/SecondaryMarketplace.sol/SecondaryMarketplace.json";
  const destinationPath =
    "../react-repo/src/contracts/SecondaryMarketplace.json";
  await fse.copy(sourcePath, destinationPath);
}

async function main() {
  const [deployer, addr1, addr2] = await ethers.getSigners();

  const concert = await hre.ethers.deployContract("Concert");
  await concert.waitForDeployment();
  const ticket = await hre.ethers.deployContract("Ticket", [
    concert.target,
    "EtherealTickets",
    "ET",
  ]);
  await ticket.waitForDeployment();
  const marketplace = await hre.ethers.deployContract("Marketplace", [
    concert.target,
    ticket.target,
  ]);
  await marketplace.waitForDeployment();
  const secondaryMarketPlace = await hre.ethers.deployContract(
    "SecondaryMarketplace",
    [concert.target, ticket.target, marketplace.target]
  );
  await secondaryMarketPlace.waitForDeployment();

  const owner = await concert.getOwner();
  console.log(`Owner: ${owner}`);

  console.log(`Concert contract deployed to ${concert.target}`);
  console.log(`Ticket contract deployed to ${ticket.target}`);
  console.log(`Marketplace contract deployed to ${marketplace.target}`);
  console.log(
    `SecondaryMarketplace contract deployed to ${secondaryMarketPlace.target}`
  );

  await updateAddressFile(
    concert.target,
    ticket.target,
    marketplace.target,
    secondaryMarketPlace.target
  );
  await copyConcertArtifact();
  await copyTicketArtifact();
  await copyMarketplaceArtifact();
  await copySecondaryMarketplaceArtifact();

  const ONE_ETH = ethers.parseEther("1.0");
  const TWO_ETH = ethers.parseEther("2.0");
  const THREE_ETH = ethers.parseEther("3.0");
  const SIX_ETH = ethers.parseEther("6.0");

  // preload concert data
  // Concert 1: Stage = INITIALIZATION
  await concert.createConcert(
    "Coldplay",
    "National Stadium",
    [THREE_ETH, TWO_ETH, ONE_ETH],
    [10, 20, 30],
    1,
    1
  );

  // Concert 2: Stage = PRIMARY_SALE
  await concert.createConcert(
    "Ed Sheeran",
    "National Stadium",
    [THREE_ETH, TWO_ETH, ONE_ETH],
    [10, 20, 30],
    2,
    2
  );
  await concert.updateConcertStage(2);

  // Concert 3: Stage = SECONDARY_SALE
  await concert.createConcert(
    "Taylor Swift",
    "National Stadium",
    [THREE_ETH, TWO_ETH, ONE_ETH],
    [10, 20, 30],
    3,
    3
  );
  await concert.updateConcertStage(3);
  await concert.updateConcertStage(3);

  // Ticket 1
  await marketplace.connect(addr1).joinQueue(3);
  await marketplace
    .connect(addr1)
    .buyTicket(3, [1], ["S1234567A"], { value: THREE_ETH });
  // await secondaryMarketPlace.createSecondaryMarketplace(3);
  // await secondaryMarketPlace.connect(addr1).listTicket(1, "S1234567A");

  // Concert 4: Stage = OPEN
  await concert.createConcert(
    "Bruno Mars",
    "National Stadium",
    [THREE_ETH, TWO_ETH, ONE_ETH],
    [10, 20, 30],
    4,
    4
  );
  await concert.updateConcertStage(4);
  await concert.updateConcertStage(4);

  // Ticket 2 and 3
  await marketplace.connect(addr1).joinQueue(4);
  await marketplace
    .connect(addr1)
    .buyTicket(4, [1, 2], ["S1234567A", "S1234567B"], { value: SIX_ETH });

  await concert.updateConcertStage(4);

  // preload ticket data

  // // ------ Secondary Marketplace ------
  const standardisedTicketCost = ONE_ETH;
  // Concert 5:
  await concert.createConcert(
    "Bruno Mars Day 1",
    "Indoor Stadium",
    [ONE_ETH],
    [1],
    5,
    5
  );
  await concert.updateConcertStage(5); //update to primary_sale
  await marketplace.connect(addr1).joinQueue(5);
  await marketplace.connect(addr1).buyTicket(5, [1], ["S1234567A"], {value: standardisedTicketCost});
  await ticket.connect(addr1).setApprovalForAll(secondaryMarketPlace, true);
  await concert.updateConcertStage(5); //update to secondary_sale
  await secondaryMarketPlace.createSecondaryMarketplace(5);
  //await concert.updateConcertStage(5);
  //await secondaryMarketPlace.connect(addr1).listTicket(4, "S1234567A");
  //await ticket.connect(addr1).setApprovalForAll(secondaryMarketPlace, true);
  //await ticket.connect(addr1).setApprovalForAll(secondaryMarketplaceAddr, true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
