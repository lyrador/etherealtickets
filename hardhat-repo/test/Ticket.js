const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { expect } = require("chai");

  const ONE_ETH = ethers.parseEther("1.0");

  describe("Ticket", function () {
    async function deployFixture() {
      const [owner, addr1] = await ethers.getSigners();
  
      const concertContract = await ethers.deployContract("Concert");
  
      const ticketContract = await ethers.deployContract("Ticket", [
        concertContract.target,
      ]);
    
      return { concertContract, ticketContract, owner, addr1}
  }

  // Create ticket
    it("Should create a ticket and emit a TicketCreated event", async function() {
      const { concertContract, ticketContract, owner } = await loadFixture(deployFixture);
      // Create concert first (name, location, ticketCost, categorySeatNumber, concertDate, salesDate)
      await concertContract.connect(owner).createConcert("Taylor Swift Day 1", "National Stadium", [100, 200, 300], [50, 100, 150], 20250101, 20240101);
      // ticketId = 1, concertId = 1, buyer = owner, category = 1, cost = ONE_ETH, passportId = PASS123  
      await expect(ticketContract.createTicket(1, 1, owner.address, 1, ONE_ETH, "PASS123"))
      .to.emit(ticketContract, "TicketCreated")
      .withArgs(1, 1, owner.address, 1, ONE_ETH, "PASS123");
      });

    // Transfer ticket
    it("Should allow ticket owner to update ticket ownership", async function () {
      const {concertContract, ticketContract, owner, addr1 } = await loadFixture(deployFixture);
      // Create concert
      await concertContract.connect(owner).createConcert("Taylor Swift Day 1", "National Stadium", [100, 200, 300], [50, 100, 150], 20250101, 20240101);
      // Create ticket
      await ticketContract.createTicket(1, 1, owner.address, 1, ONE_ETH, "PASS123");
      // Update ticket's ownership
      await ticketContract.connect(owner).updateTicketOwner(1, addr1.address);
      // Check the new owner is correct
      expect(await ticketContract.getTicketOwner(1)).to.equal(addr1.address);
    });

    // Validate ticket with passportId
    it("Should validate a ticket with the correct passportId", async function () {
      const { concertContract, ticketContract, owner } = await loadFixture(deployFixture);
      // Create concert
      await concertContract.connect(owner).createConcert("Taylor Swift Day 1", "National Stadium", [100, 200, 300], [50, 100, 150], 20250101, 20240101);
      // Create ticket
      await ticketContract.createTicket(1, 1, owner.address, 1, ONE_ETH, "PASS123");
      // Validate the ticket
      const isValid = await ticketContract.validateTicket(1, "PASS123");
      expect(isValid).to.be.true;
    });
});
