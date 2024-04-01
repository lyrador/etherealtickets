// const {
//   loadFixture,
// } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// const { expect } = require("chai");

// const ONE_ETH = 10n ** 18n;

// describe("EtherealTickets", function () {
//   async function deployFixture() {
//     const [owner, addr1, addr2] = await ethers.getSigners();

//     const concertContract = await ethers.deployContract("Concert");

//     const ticketContract = await ethers.deployContract("Ticket", [
//       concertContract.target,
//     ]);

//     const marketplaceContract = await ethers.deployContract("Marketplace", [
//       concertContract.target,
//       ticketContract.target,
//       "EtherealTickets",
//       "ET",
//     ]);

//     // Fixtures can return anything you consider useful for your tests
//     return { concertContract, marketplaceContract, owner, addr1, addr2 };
//   }

//   async function joinQueueFixture(concertContract) {
//     // Concert 1: Stage = PRIMARY_SALE
//     await concertContract.createConcert(
//       "Taylor Swift Day 1",
//       "National Stadium",
//       [3, 2, 1],
//       [10, 20, 30],
//       1,
//       1
//     );
//     await concertContract.updateConcertStage(1);

//     // Concert 2: Stage = SECONDARY_SALE
//     await concertContract.createConcert(
//       "Taylor Swift Day 2",
//       "National Stadium",
//       [3, 2, 1],
//       [10, 20, 30],
//       2,
//       2
//     );
//     await concertContract.updateConcertStage(2);
//     await concertContract.updateConcertStage(2);

//     // Concert 3: Stage = INITIALIZATION
//     await concertContract.createConcert(
//       "Taylor Swift Day 2",
//       "National Stadium",
//       [3, 2, 1],
//       [10, 20, 30],
//       2,
//       2
//     );
//   }

//   async function buyTicketFixture(
//     concertContract,
//     marketplaceContract,
//     addr1,
//     addr2
//   ) {
//     await concertContract.createConcert(
//       "Taylor Swift Day 1",
//       "National Stadium",
//       [3, 2, 1],
//       [100, 200, 300],
//       1,
//       1
//     );
//     await concertContract.updateConcertStage(1);

//     await marketplaceContract.connect(addr1).joinQueue(1);
//     await marketplaceContract.connect(addr2).joinQueue(1);
//   }

//   describe("Deployment", function () {
//     it("Concert contract deployed successfully", async function () {
//       const { concertContract, owner } = await loadFixture(deployFixture);
//       expect(await concertContract.getOwner()).to.equal(owner);
//     });

//     it("Marketplace contract deployed successfully", async function () {
//       const { marketplaceContract, owner } = await loadFixture(deployFixture);
//       expect(await marketplaceContract.getOwner()).to.equal(owner);
//     });
//   });

//   describe("Marketplace", function () {
//     const SEATS = [1, 2];
//     const SEATS_SECOND = [3, 4];
//     const INVALID_SEATS = [1001];
//     const PASSPORTS = ["12345678", "12345678"];

//     it("Join queue for concert at primary sales stage", async function () {
//       const { concertContract, marketplaceContract, addr1 } = await loadFixture(
//         deployFixture
//       );
//       const joinQueueFixtureArrow = async () =>
//         joinQueueFixture(concertContract);
//       await loadFixture(joinQueueFixtureArrow);
//       await marketplaceContract.connect(addr1).joinQueue(1);
//       const queued = await marketplaceContract.connect(addr1).getHasQueued(1);
//       expect(queued).to.equal(true);
//     });

//     it("Join queue for concert at secondary sales stage", async function () {
//       const { concertContract, marketplaceContract, addr1 } = await loadFixture(
//         deployFixture
//       );
//       const joinQueueFixtureArrow = async () =>
//         joinQueueFixture(concertContract);
//       await loadFixture(joinQueueFixtureArrow);
//       await marketplaceContract.connect(addr1).joinQueue(2);
//       const queued = await marketplaceContract.connect(addr1).getHasQueued(2);
//       expect(queued).to.equal(true);
//     });

//     it("Cannot join queue for concert not at primary or secondary sales stage", async function () {
//       const { concertContract, marketplaceContract, addr1 } = await loadFixture(
//         deployFixture
//       );
//       const joinQueueFixtureArrow = async () =>
//         joinQueueFixture(concertContract);
//       await loadFixture(joinQueueFixtureArrow);

//       await expect(
//         marketplaceContract.connect(addr1).joinQueue(3)
//       ).to.be.revertedWith("Primary marketplace is closed");
//     });

//     it("Cannot join queue again for same concert", async function () {
//       const { concertContract, marketplaceContract, addr1 } = await loadFixture(
//         deployFixture
//       );
//       const joinQueueFixtureArrow = async () =>
//         joinQueueFixture(concertContract);
//       await loadFixture(joinQueueFixtureArrow);
//       await marketplaceContract.connect(addr1).joinQueue(1);
//       await expect(
//         marketplaceContract.connect(addr1).joinQueue(1)
//       ).to.be.revertedWith("You are already in the queue");
//     });

//     it("Cannot join queue for invalid concert id", async function () {
//       const { concertContract, marketplaceContract, addr1 } = await loadFixture(
//         deployFixture
//       );
//       const joinQueueFixtureArrow = async () =>
//         joinQueueFixture(concertContract);
//       await loadFixture(joinQueueFixtureArrow);

//       await expect(
//         marketplaceContract.connect(addr1).joinQueue(4)
//       ).to.be.revertedWith("Invalid concert id");
//     });

//     it("Address 1 and 2 buy 2 tickets each", async function () {
//       const { concertContract, marketplaceContract, addr1, addr2 } =
//         await loadFixture(deployFixture);

//       const buyTicketFixtureArrow = async () =>
//         buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
//       await loadFixture(buyTicketFixtureArrow);

//       await marketplaceContract
//         .connect(addr1)
//         .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n });

//       // check if seat address is assigned correctly
//       const seat1Addr = await marketplaceContract.getSeatAddress(1, 1);
//       const seat2Addr = await marketplaceContract.getSeatAddress(1, 2);
//       expect(seat1Addr).to.equal(addr1);
//       expect(seat2Addr).to.equal(addr1);

//       // check if buyer is popped from queue
//       await expect(
//         marketplaceContract
//           .connect(addr1)
//           .buyTicket(1, SEATS_SECOND, PASSPORTS, { value: ONE_ETH * 6n })
//       ).to.be.revertedWith("Buyer not at the front of the queue");

//       await marketplaceContract
//         .connect(addr2)
//         .buyTicket(1, SEATS_SECOND, PASSPORTS, { value: ONE_ETH * 6n });

//       // check if seat address is assigned correctly
//       const seat3Addr = await marketplaceContract.getSeatAddress(1, 3);
//       const seat4Addr = await marketplaceContract.getSeatAddress(1, 4);
//       expect(seat3Addr).to.equal(addr2);
//       expect(seat4Addr).to.equal(addr2);
//     });

//     it("Cannot buy ticket if not first in queue", async function () {
//       const { concertContract, marketplaceContract, addr1, addr2 } =
//         await loadFixture(deployFixture);

//       const buyTicketFixtureArrow = async () =>
//         buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
//       await loadFixture(buyTicketFixtureArrow);

//       await expect(
//         marketplaceContract
//           .connect(addr2)
//           .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n })
//       ).to.be.revertedWith("Buyer not at the front of the queue");
//     });

//     it("Cannot buy ticket if invalid seat id", async function () {
//       const { concertContract, marketplaceContract, addr1, addr2 } =
//         await loadFixture(deployFixture);

//       const buyTicketFixtureArrow = async () =>
//         buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
//       await loadFixture(buyTicketFixtureArrow);

//       await expect(
//         marketplaceContract
//           .connect(addr1)
//           .buyTicket(1, INVALID_SEATS, PASSPORTS, { value: ONE_ETH * 6n })
//       ).to.be.revertedWith("Seat does not exist");
//     });

//     it("Cannot buy ticket if seat is taken", async function () {
//       const { concertContract, marketplaceContract, addr1, addr2 } =
//         await loadFixture(deployFixture);

//       const buyTicketFixtureArrow = async () =>
//         buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
//       await loadFixture(buyTicketFixtureArrow);

//       await marketplaceContract
//         .connect(addr1)
//         .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n });

//       await expect(
//         marketplaceContract
//           .connect(addr2)
//           .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n })
//       ).to.be.revertedWith("Seat is taken");
//     });

//     it("Cannot buy ticket if insufficient eth sent", async function () {
//       const { concertContract, marketplaceContract, addr1, addr2 } =
//         await loadFixture(deployFixture);

//       const buyTicketFixtureArrow = async () =>
//         buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
//       await loadFixture(buyTicketFixtureArrow);

//       await expect(
//         marketplaceContract
//           .connect(addr1)
//           .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH })
//       ).to.be.revertedWith("Insufficient eth sent");
//     });
//   });

//   describe("Concert", function () {
//     // Test for updating a concert
//     // it("Should allow the owner to update a concert", async function () {
//     //   const { concertContract } = await loadFixture(deployFixture);

//     //   await joinQueueFixture(concertContract);
//     //   await concertContract.updateConcert(
//     //     1,
//     //     "Updated Taylor Swift Day 1",
//     //     "Updated National Stadium",
//     //     [150, 250, 350, 450],
//     //     [150, 250, 350, 450],
//     //     3,
//     //     4
//     //   );
//     //   //for this, i need to have getters for every part of the concert so that i can do the .to.equal
//     // });

//     // Test for deleting a concert and checking whether it exists or not
//     it("Should confirm that a concert no longer exists after deletion", async function () {
//       const { concertContract } = await loadFixture(deployFixture);

//       await joinQueueFixture(concertContract);

//       await concertContract.deleteConcert(1);

//       const exists = await concertContract.isValidConcert(1);

//       expect(exists).to.equal(false);
//     });

//     //test for deleting a non existent concert
//     it("Should revert if trying to delete a non-existent concert", async function () {
//       const { concertContract } = await loadFixture(deployFixture);

//       // Attempt to delete a non-existent concert
//       await expect(concertContract.deleteConcert(999)) // Assuming 999 is an ID that doesn't exist
//         .to.be.revertedWith("Concert does not exist");
//     });

//     //test for a non owner not being able to delete a concert
//     it("Should prevent non-owners from deleting a concert", async function () {
//       const { concertContract, addr1 } = await loadFixture(deployFixture);

//       await joinQueueFixture(concertContract); // Ensure there are concerts to work with
//       // Attempt to delete a concert as a non-owner
//       await expect(
//         concertContract.connect(addr1).deleteConcert(1)
//       ).to.be.revertedWith("Caller is not the owner");
//     });

//     //test for getting the seat cost
//     it("Should return the correct seat cost based on seat number", async function () {
//       const { concertContract } = await loadFixture(deployFixture);

//       await joinQueueFixture(concertContract);

//       const costForSeat1 = await concertContract.getSeatCost(1, 1);
//       expect(costForSeat1).to.equal(3); //

//       const costForSeat101 = await concertContract.getSeatCost(1, 11); // 101st seat, should be in the second category
//       expect(costForSeat101).to.equal(2);
//     });

//     //test for getConcertID
//     it("Should return the same concert ID if the concert exists", async function () {
//       const { concertContract } = await loadFixture(deployFixture);
//       await joinQueueFixture(concertContract);

//       // Check that the function returns the correct concert ID for an existing concert
//       const concertIdForDay1 = await concertContract.getConcertID(1);
//       expect(concertIdForDay1).to.equal(1);

//       const concertIdForDay2 = await concertContract.getConcertID(2);
//       expect(concertIdForDay2).to.equal(2);
//     });

//     //test for gettingTotalTickets
//     it("Should return the total number of correct tickets", async function () {
//       const { concertContract } = await loadFixture(deployFixture);
//       await joinQueueFixture(concertContract);
//       const concertTotalTicketsForDay1 = await concertContract.getTotalTickets(
//         1
//       );
//       expect(concertTotalTicketsForDay1).to.equal(60);
//       //double check with the group about how the category tickets are formed
//     });

//     //test for getting category tickets
//     it("Should return the total number of correct tickets for a certain category", async function () {
//       const { concertContract } = await loadFixture(deployFixture);
//       await joinQueueFixture(concertContract);

//       // Checking for category 1 in concert 1 to be equal to 100
//       const concertTotalTicketsForCategory1Day1 =
//         await concertContract.getTotalTicketsForCategory(1, 1);
//       expect(concertTotalTicketsForCategory1Day1).to.equal(10);

//       // Checking for category 1 in concert 2 to be equal to 100
//       const concertTotalTicketsForCategory1Day2 =
//         await concertContract.getTotalTicketsForCategory(2, 1);
//       expect(concertTotalTicketsForCategory1Day2).to.equal(10);
//     });

//     //test for returning a concert ID
//     it("Should return true for a valid concert ID", async function () {
//       const { concertContract } = await loadFixture(deployFixture);
//       await joinQueueFixture(concertContract);

//       // Assuming concert with ID 1 is created in the fixture
//       const isValid = await concertContract.isValidConcert(1);
//       expect(isValid).to.be.true;
//     });
//   });
// });
