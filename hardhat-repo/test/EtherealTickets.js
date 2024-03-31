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
});
