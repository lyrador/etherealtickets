const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { expect } = require("chai");

  describe("Ticket", function () {
    async function deployFixture() {
      const [owner, addr1, addr2] = await ethers.getSigners();
  
      const concertContract = await ethers.deployContract("Concert");
  
      const ticketContract = await ethers.deployContract("Ticket", [
        concertContract.target,
      ]);
    
      return { concertContract, ticketContract, owner, addr1, addr2}
  }

  // Create ticket
    it("Should create a ticket and emit a TicketCreated event", async function() {
        const ticket = await ticketContract.connect(owner).createTicket(1, 100, 1, 500, "PASS123")
        await expect(ticket).to.emit(ticket, "TicketCreated").withArgs(1, 100, owner.address, 1, 500. "PASS123");
        });

    // Validate ticket ownership
    it("Should transfer ticket ownership correctly", async function () {
        await ticket.connect(owner).createTicket(1, 100, 1, 500, "PASS123");
        await ticket.connect(owner).updateTicketOwner(1, addr1.address);
        expect(await ticket.getOwner(1)).to.equal(addr1.address);
        });
    
    // Transfer of ticket
    it("Should transfer ticket ownership correctly", async function () {
        await ticket.connect(owner).createTicket(1, 100, 1, 500, "PASS123");
        await ticket.connect(owner).updateTicketOwner(1, addr1.address);
        expect(await ticket.getOwner(1)).to.equal(addr1.address);
    });

    // Validate ticket
    it("Should validate a ticket with the correct passportId", async function () {
        await ticket.connect(owner).createTicket(1, 100, 1, 500, "PASS123");
        const isValid = await ticket.validateTicket(1, "PASS123");
        expect(isValid).to.be.true;
    });
});
