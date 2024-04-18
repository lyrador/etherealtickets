const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const ONE_ETH = ethers.parseEther("1.0");
const TWO_ETH = ethers.parseEther("2.0");
const THREE_ETH = ethers.parseEther("3.0");

describe("Ticket", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

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
      owner, // owner of ticket
      addr1, // test for transfer of ticket from owner to addr1
      addr2 // concert organizer's address
    };
  }

  // Create ticket
  it("Should create a ticket and emit a TicketCreated event", async function () {
    const { concertContract, ticketContract, owner, addr2 } = await loadFixture(
      deployFixture
    );
    // Create concert first (name, location, ticketCost, categorySeatNumber, concertDate, salesDate)
    await concertContract
      .connect(addr2)
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
      ticketContract.createTicket(1, 1, owner.address, 1, ONE_ETH, "PASS123", false)
    )
      .to.emit(ticketContract, "TicketCreated")
      .withArgs(1, 1, owner.address, 1, ONE_ETH, "PASS123", false);
  });

  // Failed to create ticket for non-existent concert
  it("Should fail to create a ticket for a non-existent concert", async function () {
    const { ticketContract, owner } = await loadFixture(
      deployFixture
    );
    // concertId 999 does not exist
    await expect(ticketContract.createTicket
      (1, 999, owner.address, 1, ONE_ETH, "PASS123", false))
      .to.be.revertedWith("Concert is invalid");
  });

  // // Transfer ticket
  // it("Should allow ticket owner to update ticket ownership", async function () {
  //   const { concertContract, ticketContract, owner, addr1 } = await loadFixture(
  //     deployFixture
  //   );
  //   // Create concert
  //   await concertContract
  //     .connect(owner)
  //     .createConcert(
  //       "Taylor Swift Day 1",
  //       "National Stadium",
  //       [100, 200, 300],
  //       [50, 100, 150],
  //       20250101,
  //       20240101
  //     );
  //   // Create ticket
  //   await ticketContract.createTicket(
  //     1,
  //     1,
  //     owner.address,
  //     1,
  //     ONE_ETH,
  //     "PASS123"
  //   );
  //   // Update ticket's ownership
  //   await ticketContract.connect(owner).updateTicketOwner(1, addr1.address);
  //   // Check the new owner is correct
  //   expect(await ticketContract.getOwner(1)).to.equal(addr1.address);
  // });

  // Validate ticket with passportId
  it("Should validate a ticket with the correct passportId", async function () {
    const { concertContract, ticketContract, owner, addr2 } = await loadFixture(
      deployFixture
    );
    // Create concert - stage INITIALIZATION
    await concertContract
      .connect(addr2) // concert ORGANIZER
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
      "PASS123",
      false
    );
    // Validate the ticket
    const isValid = await ticketContract.validateTicket(1, "PASS123");
    expect(isValid).to.be.true;
  });
  
  // Ticket cannot be validated due to incorrect passportId
  it("Should not validate a ticket with the incorrect passportId", async function () {
    const { concertContract, ticketContract, owner, addr2 } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract
      .connect(addr2)
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
      "PASS123",
      false
    );
    // Attempt to validate the ticket with an incorrect passport ID
    const isValid = await ticketContract.validateTicket(1, "WRONGPASS123");
    expect(isValid).to.be.false;
  });

  // Use ticket for concert when concert is OPEN
  it("Should allow a ticket to be used if the concert is in the OPEN stage", async function () {
    const { concertContract, ticketContract, owner, addr2 } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract // stage INITIALIZATION
      .connect(addr2)
      .createConcert(
        "Taylor Swift Day 1",
        "National Stadium",
        [100, 200, 300],
        [50, 100, 150],
        20250101,
        20240101
      );
    // Keep updating the concert stage to OPEN
    await concertContract
      .connect(addr2)
      .updateConcertStage(
        1
    ); // concert 1 - stage PRIMARY_SALE
    await concertContract
      .connect(addr2)
      .updateConcertStage(
        1
    ); // concert 1 - stage SECONDARY_SALE
    await concertContract
    .connect(addr2)
    .updateConcertStage(
      1
    ); // concert 1 - stage OPEN;
  
    // Create ticket
    await ticketContract.createTicket(
      1,
      1,
      owner.address,
      1,
      ONE_ETH,
      "PASS123",
      false
    );
  
    // Attempt to use the ticket for entry
    await expect(ticketContract.connect(addr2).useTicketForConcert(1, 1, "PASS123"))
      .to.emit(ticketContract, "TicketUsed") // Assuming you emit this event when a ticket is used
      .withArgs(1, 1, owner.address);

    // Check if the ticket's `validatedForUse` is set to true
    const ticketDetails = await ticketContract.getAllTicketDetails(1);
    expect(ticketDetails.validatedForUse).to.be.true;
  });

  // Unable to use ticket for concert when concert is not OPEN
  it("Should not allow a ticket to be used if the concert is not in the OPEN stage", async function () {
    const { concertContract, ticketContract, owner, addr2 } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract
      .connect(addr2)
      .createConcert(
        "Taylor Swift Day 1",
        "National Stadium",
        [100, 200, 300],
        [50, 100, 150],
        20250101,
        20240101
      );
  
    // Manually set the concert stage to PRIMARY_SALE or any other stage than OPEN
    await concertContract
      .connect(addr2)
      .updateConcertStage(
        1
    ); // concert 1 - stage PRIMARY_SALE
  
    // Create ticket
    await ticketContract.createTicket(
      1,
      1,
      owner.address,
      1,
      ONE_ETH,
      "PASS123",
      false
    );
  
    // Attempt to use the ticket for entry
    await expect(ticketContract.connect(addr2).useTicketForConcert(1, 1, "PASS123"))
      .to.be.revertedWith("You cannot use ticket for concert as it is not in the correct Stage");
  });
  
  // Test ticket view function - should show ticketId, concertId, category and cost
  it("Should return the correct ticket's information", async function () {
    const { concertContract, ticketContract, owner, addr2 } = await loadFixture(
      deployFixture
    );
    // Create concert
    await concertContract
      .connect(addr2)
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
      "PASS123",
      false
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

    const addr1Tickets = await ticketContract.connect(addr1).getOwnedTickets(addr1);
    expect(addr1Tickets.length).to.equal(2);
  });
});
