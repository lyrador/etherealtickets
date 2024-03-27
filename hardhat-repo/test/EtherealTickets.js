const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

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
      [100, 200, 300, 400],
      [10, 20, 30, 40],
      1,
      1
    );
    await concertContract.updateConcertStage(1);

    await concertContract.createConcert(
      "Taylor Swift Day 2",
      "National Stadium",
      [100, 200, 300, 400],
      [10, 20, 30, 40],
      2,
      2
    );
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
  });
});
