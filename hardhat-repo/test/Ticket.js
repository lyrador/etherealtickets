const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const ONE_ETH = ethers.parseEther("1.0");
const TWO_ETH = ethers.parseEther("2.0");
const THREE_ETH = ethers.parseEther("3.0");

describe("Ticket", function () {
  async function deployFixture() {
    const [owner, addr1] = await ethers.getSigners();

    const concertContract = await ethers.deployContract("Concert");

    const ticketContract = await ethers.deployContract("Ticket", [
      concertContract.target,
      "EtherealTickets",
      "ET",
    ]);

    const marketplaceContract = await ethers.deployContract("Marketplace", [
      concertContract.target,
      ticketContract.target,
    ]);

    return {
      concertContract,
      ticketContract,
      marketplaceContract,
      owner,
      addr1,
    };
  }

  // Create ticket
  it("Should create a ticket and emit a TicketCreated event", async function () {
    const { concertContract, ticketContract, owner } = await loadFixture(
      deployFixture
    );
    // Create concert first (name, location, ticketCost, categorySeatNumber, concertDate, salesDate)
    await concertContract
      .connect(owner)
      .createConcert(
        "Taylor Swift Day 1",
        "National Stadium",
        [100, 200, 300],
        [50, 100, 150],
        20250101,
        20240101
      );
    // ticketId = 1, concertId = 1, buyer = owner, category = 1, cost = ONE_ETH, passportId = PASS123
    await expect(
      ticketContract.createTicket(1, 1, owner.address, 1, ONE_ETH, "PASS123")
    )
      .to.emit(ticketContract, "TicketCreated")
      .withArgs(1, 1, owner.address, 1, ONE_ETH, "PASS123");
  });

  // Transfer ticket
  it("Should allow ticket owner to update ticket ownership", async function () {
    const { concertContract, ticketContract, owner, addr1 } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract
      .connect(owner)
      .createConcert(
        "Taylor Swift Day 1",
        "National Stadium",
        [100, 200, 300],
        [50, 100, 150],
        20250101,
        20240101
      );
    // Create ticket
    await ticketContract.createTicket(
      1,
      1,
      owner.address,
      1,
      ONE_ETH,
      "PASS123"
    );
    // Update ticket's ownership
    await ticketContract.connect(owner).updateTicketOwner(1, addr1.address);
    // Check the new owner is correct
    expect(await ticketContract.getOwner(1)).to.equal(addr1.address);
  });

  // Validate ticket with passportId
  it("Should validate a ticket with the correct passportId", async function () {
    const { concertContract, ticketContract, owner } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract
      .connect(owner)
      .createConcert(
        "Taylor Swift Day 1",
        "National Stadium",
        [100, 200, 300],
        [50, 100, 150],
        20250101,
        20240101
      );
    // Create ticket
    await ticketContract.createTicket(
      1,
      1,
      owner.address,
      1,
      ONE_ETH,
      "PASS123"
    );
    // Validate the ticket
    const isValid = await ticketContract.validateTicket(1, "PASS123");
    expect(isValid).to.be.true;
  });

  // Test ticket view function - should show ticketId, concertId, category and cost
  it("Should return the correct ticket's information", async function () {
    const { concertContract, ticketContract, owner } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract
      .connect(owner)
      .createConcert(
        "Taylor Swift Day 1",
        "National Stadium",
        [100, 200, 300],
        [50, 100, 150],
        20250101,
        20240101
      );
    // Create ticket with ticketId = 1, concertId = 1, category = 1, cost = ONE_ETH
    await ticketContract.createTicket(
      1,
      1,
      owner.address,
      1,
      ONE_ETH,
      "PASS123"
    );
    // Call the getTicketDetails function
    const [ticketId, concertId, category, cost] =
      await ticketContract.getTicketDetails(1);
    // Validate the details against expected values
    expect(ticketId).to.equal(1);
    expect(concertId).to.equal(1);
    expect(category).to.equal(1);
    expect(cost).to.equal(ONE_ETH);
  });

  // View owned tickets
  it("User 1 owns 2 tickets", async function () {
    const { concertContract, ticketContract, marketplaceContract, addr1 } =
      await loadFixture(deployFixture);
    await concertContract.createConcert(
      "Bruno Mars",
      "National Stadium",
      [THREE_ETH, TWO_ETH, ONE_ETH],
      [10, 20, 30],
      4,
      4
    );
    await concertContract.updateConcertStage(1);

    // Ticket 2 and 3
    await marketplaceContract.connect(addr1).joinQueue(1);
    await marketplaceContract
      .connect(addr1)
      .buyTicket(1, [1, 2], ["S1234567A", "S1234567B"], {
        value: ONE_ETH * 6n,
      });

    const addr1Tickets = await ticketContract.connect(addr1).getOwnedTickets();
    expect(addr1Tickets.length).to.equal(2);
  });
});
