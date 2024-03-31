const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const ONE_ETH = 10n ** 18n;
const TWO_ETH = 10n ** 18n * 2n;
const THREE_ETH = 10n ** 18n * 3n;
const FOUR_ETH = 10n ** 18n * 4n;

describe("EtherealTickets", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const concertContract = await ethers.deployContract("Concert");

    const marketplaceContract = await ethers.deployContract("Marketplace", [
      concertContract.target,
      "EtherealTickets",
      "ET",
    ]);

    // Fixtures can return anything you consider useful for your tests
    return { concertContract, marketplaceContract, owner, addr1, addr2 };
  }

  async function createConcertFixture(concertContract) {
    await concertContract.createConcert(
      "Taylor Swift Day 1",
      "National Stadium",
      [1, 2, 3, 4],
      [100, 200, 300, 400],
      1,
      1
    );
    await concertContract.updateConcertStage(1);

    await concertContract.createConcert(
      "Taylor Swift Day 2",
      "National Stadium",
      [1, 2, 3, 4],
      [100, 200, 300, 400],
      2,
      2
    );
  }

  async function buyTicketsFixture(marketplaceContract, addr1, addr2) {
    await marketplaceContract.connect(addr1).joinQueue(1);
    await marketplaceContract.connect(addr2).joinQueue(1);
  }

  describe("Deployment", function () {
    it("Concert contract deployed successfully", async function () {
      const { concertContract, owner } = await loadFixture(deployFixture);
      expect(await concertContract.getOwner()).to.equal(owner);
    });

    it("Marketplace contract deployed successfully", async function () {
      const { marketplaceContract, owner } = await loadFixture(deployFixture);
      expect(await marketplaceContract.getOwner()).to.equal(owner);
    });
  });

  describe("Marketplace", function () {
    const SEATS = [1, 2];
    const SEATS_SECOND = [3, 4];
    const INVALID_SEATS = [1001];
    const PASSPORTS = ["12345678", "12345678"];

    it("Join queue", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);
      await marketplaceContract.connect(addr1).joinQueue(1);
      const queued = await marketplaceContract.connect(addr1).getHasQueued(1);
      expect(queued).to.equal(true);
    });

    it("Cannot join queue again for same concert", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);
      await marketplaceContract.connect(addr1).joinQueue(1);
      await expect(
        marketplaceContract.connect(addr1).joinQueue(1)
      ).to.be.revertedWith("You are already in the queue");
    });

    it("Cannot join queue for concert that before primary sale stage", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      await expect(
        marketplaceContract.connect(addr1).joinQueue(2)
      ).to.be.revertedWith("Not at primary sale stage");
    });

    it("Cannot join queue for invalid concert id", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      await expect(
        marketplaceContract.connect(addr1).joinQueue(3)
      ).to.be.revertedWith("Invalid concert id");
    });

    it("Buy tickets for 2 eth", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      const marketplaceFixture = async () =>
        buyTicketsFixture(marketplaceContract, addr1, addr2);
      await loadFixture(marketplaceFixture);

      await marketplaceContract
        .connect(addr1)
        .buyTicket(1, SEATS, PASSPORTS, { value: TWO_ETH });

      // check if seat address is assigned correctly
      const seat1Addr = await marketplaceContract.getSeatAddress(1, 1);
      const seat2Addr = await marketplaceContract.getSeatAddress(1, 2);
      expect(seat1Addr).to.equal(addr1);
      expect(seat2Addr).to.equal(addr1);

      // check if buyer is popped from queue
      await expect(
        marketplaceContract
          .connect(addr1)
          .buyTicket(1, SEATS_SECOND, PASSPORTS, { value: TWO_ETH })
      ).to.be.revertedWith("Buyer not at the front of the queue");

      await marketplaceContract
        .connect(addr2)
        .buyTicket(1, SEATS_SECOND, PASSPORTS, { value: TWO_ETH });

      // check if seat address is assigned correctly
      const seat3Addr = await marketplaceContract.getSeatAddress(1, 3);
      const seat4Addr = await marketplaceContract.getSeatAddress(1, 4);
      expect(seat3Addr).to.equal(addr2);
      expect(seat4Addr).to.equal(addr2);
    });

    it("Cannot buy ticket if not first in queue", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      const marketplaceFixture = async () =>
        buyTicketsFixture(marketplaceContract, addr1, addr2);
      await loadFixture(marketplaceFixture);

      await expect(
        marketplaceContract
          .connect(addr2)
          .buyTicket(1, SEATS, PASSPORTS, { value: TWO_ETH })
      ).to.be.revertedWith("Buyer not at the front of the queue");
    });

    it("Cannot buy ticket if invalid seat id", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      const marketplaceFixture = async () =>
        buyTicketsFixture(marketplaceContract, addr1, addr2);
      await loadFixture(marketplaceFixture);

      await expect(
        marketplaceContract
          .connect(addr1)
          .buyTicket(1, INVALID_SEATS, PASSPORTS, { value: TWO_ETH })
      ).to.be.revertedWith("Seat does not exist");
    });

    it("Cannot buy ticket if seat is taken", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      const marketplaceFixture = async () =>
        buyTicketsFixture(marketplaceContract, addr1, addr2);
      await loadFixture(marketplaceFixture);

      await marketplaceContract
        .connect(addr1)
        .buyTicket(1, SEATS, PASSPORTS, { value: TWO_ETH });

      await expect(
        marketplaceContract
          .connect(addr2)
          .buyTicket(1, SEATS, PASSPORTS, { value: TWO_ETH })
      ).to.be.revertedWith("Seat is taken");
    });

    it("Cannot buy ticket if insufficient eth sent", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const concertFixture = async () => createConcertFixture(concertContract);
      await loadFixture(concertFixture);

      const marketplaceFixture = async () =>
        buyTicketsFixture(marketplaceContract, addr1, addr2);
      await loadFixture(marketplaceFixture);

      await expect(
        marketplaceContract
          .connect(addr1)
          .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH })
      ).to.be.revertedWith("Insufficient eth sent");
    });
  });

  describe("Concert", function () {
    // Test for updating a concert
    it("Should allow the owner to update a concert", async function () {
      const { concertContract } = await loadFixture(deployFixture);

      await createConcertFixture(concertContract);
      await concertContract.updateConcert(
        1, 
        "Updated Taylor Swift Day 1", 
        "Updated National Stadium", 
        [150, 250, 350, 450], 
        [150, 250, 350, 450], 
        3, 
        4
      );

      //checking that all is equal to each other
      const updatedConcert = await concertContract.concerts(1);
      expect(updatedConcert.name).to.equal("Updated Taylor Swift Day 1");
      expect(updatedConcert.location).to.equal("Updated National Stadium");
      expect(updatedConcert.ticketCost).to.equal([150,250,350,450]);
      expect(updatedConcert.categorySeatNumber).to.equal([150,250,350,450]);
      expect(updatedConcert.concertDate).to.equal(3);
      expect(updatedConcert.salesDate).to.equal(4);
    });

    // Test for deleting a concert
    it("Should allow the owner to delete a concert", async function () {
      const { concertContract } = await loadFixture(deployFixture);

      await createConcertFixture(concertContract); 
      await concertContract.deleteConcert(1); 

      // Attempt to fetch details of the deleted concert
      const concert = await concertContract.concerts(1);
      expect(concert.id).to.equal(0); 
    });

    //test for deleting a non existent concert
    it("Should revert if trying to delete a non-existent concert", async function () {
      const { concertContract } = await loadFixture(deployFixture);

      // Attempt to delete a non-existent concert
      await expect(concertContract.deleteConcert(999)) // Assuming 999 is an ID that doesn't exist
        .to.be.revertedWith("Concert does not exist");
    });

    //test for a non owner not being able to delete a concert
    it("Should prevent non-owners from deleting a concert", async function () {
      const { concertContract, addr1 } = await loadFixture(deployFixture);

      await createConcertFixture(concertContract); // Ensure there are concerts to work with
      // Attempt to delete a concert as a non-owner
      await expect(concertContract.connect(addr1).deleteConcert(1))
        .to.be.revertedWith("Caller is not the owner");
    });

    //test for getting the seat cost
    it("Should return the correct seat cost based on seat number", async function () {
      const { concertContract } = await loadFixture(deployFixture);

      const costForSeat1 = await concertContract.getSeatCost(1, 1); 
      expect(costForSeat1).to.equal(100);

      const costForSeat101 = await concertContract.getSeatCost(1, 101); // 101st seat, should be in the second category
      expect(costForSeat101).to.equal(200);
    });

    //test for getConcertID
    it("Should return the same concert ID if the concert exists", async function () {
      const { concertContract } = await loadFixture(deployFixture);

      // Check that the function returns the correct concert ID for an existing concert
      const concertIdForDay1 = await concertContract.getConcertID(1);
      expect(concertIdForDay1).to.equal(1);

      const concertIdForDay2 = await concertContract.getConcertID(2);
      expect(concertIdForDay2).to.equal(2);
    });

    //test for gettingTotalTickets
    it("Should return the total number of correct tickets", async function() {
      const { concertContract } = await loadFixture(deployFixture);
      const concertTotalTicketsForDay1 = await concertContract.getTotalTickets(1);
      expect(concertTotalTicketsForDay1.to.equal(400));
    })

    //test for getting category tickets
    it("Should return the total number of correct tickets for a certain category", async function() {
      const { concertContract } = await loadFixture(deployFixture);
      //checking for both category 1 and day 1 to be equals to a 100;
      const concertTotalTicketsForCategory1Day1 = await concertContract.getTotalTicketsForCategory(1,1);
      const concertTotalTicketsForCategory1Day2 = await concertContract.getTotalTicketsForCategory(1,2);
      expect(concertTotalTicketsForCategory1Day1.to.equal(100));
      expect(concertTotalTicketsForCategory1Day2.to.equal(100));

    })
    //test for returning a concert ID
    it("Should return true for a valid concert ID", async function () {
      const { concertContract } = await loadFixture(createConcertFixture);

      // Assuming concert with ID 1 is created in the fixture
      const isValid = await concertContract.isValidConcert(1);
      expect(isValid).to.be.true;
     });
  });
});
