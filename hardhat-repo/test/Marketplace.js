const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const ONE_ETH = ethers.parseEther("1.0");
const TWO_ETH = ethers.parseEther("2.0");
const THREE_ETH = ethers.parseEther("3.0");

const SEATS = [1, 2];
const SEATS_SECOND = [3, 4];
const INVALID_SEATS = [1001];
const PASSPORTS = ["12345678", "12345678"];

describe("Marketplace", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const concertContract = await ethers.deployContract("Concert");

    const ticketContract = await ethers.deployContract("Ticket", [
      concertContract.target,
    ]);

    const marketplaceContract = await ethers.deployContract("Marketplace", [
      concertContract.target,
      ticketContract.target,
      "EtherealTickets",
      "ET",
    ]);

    // Fixtures can return anything you consider useful for your tests
    return { concertContract, marketplaceContract, owner, addr1, addr2 };
  }

  async function joinQueueFixture(concertContract) {
    // Concert 1: Stage = PRIMARY_SALE
    await concertContract.createConcert(
      "Taylor Swift Day 1",
      "National Stadium",
      [THREE_ETH, TWO_ETH, ONE_ETH],
      [10, 20, 30],
      1,
      1
    );
    await concertContract.updateConcertStage(1);

    // Concert 2: Stage = SECONDARY_SALE
    await concertContract.createConcert(
      "Taylor Swift Day 2",
      "National Stadium",
      [THREE_ETH, TWO_ETH, ONE_ETH],
      [10, 20, 30],
      2,
      2
    );
    await concertContract.updateConcertStage(2);
    await concertContract.updateConcertStage(2);

    // Concert 3: Stage = INITIALIZATION
    await concertContract.createConcert(
      "Taylor Swift Day 3",
      "National Stadium",
      [THREE_ETH, TWO_ETH, ONE_ETH],
      [10, 20, 30],
      3,
      3
    );

    // Concert 4: Stage = PRIMARY_SALE
    await concertContract.createConcert(
      "Taylor Swift Day 4",
      "National Stadium",
      [THREE_ETH, TWO_ETH, ONE_ETH],
      [10, 20, 30],
      4,
      4
    );
    await concertContract.updateConcertStage(4);
  }

  async function buyTicketFixture(
    concertContract,
    marketplaceContract,
    addr1,
    addr2
  ) {
    await concertContract.createConcert(
      "Taylor Swift Day 1",
      "National Stadium",
      [THREE_ETH, TWO_ETH, ONE_ETH],
      [100, 200, 300],
      1,
      1
    );
    await concertContract.updateConcertStage(1);

    await marketplaceContract.connect(addr1).joinQueue(1);
    await marketplaceContract.connect(addr2).joinQueue(1);
  }

  //   it("Get concerts at primary sales stage", async function () {
  //     const { concertContract, addr1 } = await loadFixture(deployFixture);
  //     const joinQueueFixtureArrow = async () => joinQueueFixture(concertContract);
  //     await loadFixture(joinQueueFixtureArrow);

  //     const primarySalesConcerts = await concertContract.getConcertsByStage(1);
  //     expect(primarySalesConcerts.length).to.equal(2);
  //   });

  describe("Join Queue", function () {
    it("Join queue for concert at primary sales stage", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const joinQueueFixtureArrow = async () =>
        joinQueueFixture(concertContract);
      await loadFixture(joinQueueFixtureArrow);
      await marketplaceContract.connect(addr1).joinQueue(1);
      await marketplaceContract.connect(addr2).joinQueue(1);

      const queued1 = await marketplaceContract.connect(addr1).getHasQueued(1);
      expect(queued1).to.equal(true);
      const position1 = await marketplaceContract
        .connect(addr1)
        .getQueuePosition(1);
      expect(position1).to.equal(1);

      const queued2 = await marketplaceContract.connect(addr2).getHasQueued(1);
      expect(queued2).to.equal(true);
      const position2 = await marketplaceContract
        .connect(addr2)
        .getQueuePosition(1);
      expect(position2).to.equal(2);
    });

    it("Join queue for concert at secondary sales stage", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);
      const joinQueueFixtureArrow = async () =>
        joinQueueFixture(concertContract);
      await loadFixture(joinQueueFixtureArrow);
      await marketplaceContract.connect(addr1).joinQueue(2);
      await marketplaceContract.connect(addr2).joinQueue(2);

      const queued1 = await marketplaceContract.connect(addr1).getHasQueued(2);
      expect(queued1).to.equal(true);
      const position1 = await marketplaceContract
        .connect(addr1)
        .getQueuePosition(2);
      expect(position1).to.equal(1);

      const queued2 = await marketplaceContract.connect(addr2).getHasQueued(2);
      expect(queued2).to.equal(true);
      const position2 = await marketplaceContract
        .connect(addr2)
        .getQueuePosition(2);
      expect(position2).to.equal(2);
    });

    it("Cannot join queue for concert not at primary or secondary sales stage", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const joinQueueFixtureArrow = async () =>
        joinQueueFixture(concertContract);
      await loadFixture(joinQueueFixtureArrow);

      await expect(
        marketplaceContract.connect(addr1).joinQueue(3)
      ).to.be.revertedWith("Primary marketplace is closed");
    });

    it("Cannot join queue again for same concert", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const joinQueueFixtureArrow = async () =>
        joinQueueFixture(concertContract);
      await loadFixture(joinQueueFixtureArrow);
      await marketplaceContract.connect(addr1).joinQueue(1);
      await expect(
        marketplaceContract.connect(addr1).joinQueue(1)
      ).to.be.revertedWith("You are already in the queue");
    });

    it("Cannot join queue for invalid concert id", async function () {
      const { concertContract, marketplaceContract, addr1 } = await loadFixture(
        deployFixture
      );
      const joinQueueFixtureArrow = async () =>
        joinQueueFixture(concertContract);
      await loadFixture(joinQueueFixtureArrow);

      await expect(
        marketplaceContract.connect(addr1).joinQueue(5)
      ).to.be.revertedWith("Invalid concert id");
    });
  });

  describe("Buy Ticket", function () {
    it("Address 1 and 2 buy 2 tickets each", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);

      const buyTicketFixtureArrow = async () =>
        buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
      await loadFixture(buyTicketFixtureArrow);

      await marketplaceContract
        .connect(addr1)
        .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n });

      // check if seat address is assigned correctly
      const seat1Addr = await marketplaceContract.getSeatAddress(1, 1);
      const seat2Addr = await marketplaceContract.getSeatAddress(1, 2);
      expect(seat1Addr).to.equal(addr1);
      expect(seat2Addr).to.equal(addr1);

      // check if buyer is popped from queue
      await expect(
        marketplaceContract
          .connect(addr1)
          .buyTicket(1, SEATS_SECOND, PASSPORTS, { value: ONE_ETH * 6n })
      ).to.be.revertedWith("Buyer not at the front of the queue");

      await marketplaceContract
        .connect(addr2)
        .buyTicket(1, SEATS_SECOND, PASSPORTS, { value: ONE_ETH * 6n });

      // check if seat address is assigned correctly
      const seat3Addr = await marketplaceContract.getSeatAddress(1, 3);
      const seat4Addr = await marketplaceContract.getSeatAddress(1, 4);
      expect(seat3Addr).to.equal(addr2);
      expect(seat4Addr).to.equal(addr2);
    });

    it("Cannot buy ticket if not first in queue", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);

      const buyTicketFixtureArrow = async () =>
        buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
      await loadFixture(buyTicketFixtureArrow);

      await expect(
        marketplaceContract
          .connect(addr2)
          .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n })
      ).to.be.revertedWith("Buyer not at the front of the queue");
    });

    it("Cannot buy ticket if invalid seat id", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);

      const buyTicketFixtureArrow = async () =>
        buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
      await loadFixture(buyTicketFixtureArrow);

      await expect(
        marketplaceContract
          .connect(addr1)
          .buyTicket(1, INVALID_SEATS, PASSPORTS, { value: ONE_ETH * 6n })
      ).to.be.revertedWith("Seat does not exist");
    });

    it("Cannot buy ticket if seat is taken", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);

      const buyTicketFixtureArrow = async () =>
        buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
      await loadFixture(buyTicketFixtureArrow);

      await marketplaceContract
        .connect(addr1)
        .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n });

      await expect(
        marketplaceContract
          .connect(addr2)
          .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH * 6n })
      ).to.be.revertedWith("Seat is taken");
    });

    it("Cannot buy ticket if insufficient eth sent", async function () {
      const { concertContract, marketplaceContract, addr1, addr2 } =
        await loadFixture(deployFixture);

      const buyTicketFixtureArrow = async () =>
        buyTicketFixture(concertContract, marketplaceContract, addr1, addr2);
      await loadFixture(buyTicketFixtureArrow);

      await expect(
        marketplaceContract
          .connect(addr1)
          .buyTicket(1, SEATS, PASSPORTS, { value: ONE_ETH })
      ).to.be.revertedWith("Insufficient eth sent");
    });
  });
});
