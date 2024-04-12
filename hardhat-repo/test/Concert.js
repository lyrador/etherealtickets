const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

const ONE_ETH = ethers.parseEther("1.0");
const TWO_ETH = ethers.parseEther("2.0");
const THREE_ETH = ethers.parseEther("3.0");

describe("Concert", function () {
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

  //Test for creating a concert and making sure it exists
  it("Should successfully create a concert and verify its existence", async function () {
    const { concertContract } = await loadFixture(deployFixture);

    const name = "Taylor Swift Day 1";
    const location = "National Stadium";
    const ticketCost = [100, 200, 300];
    const categorySeatNumber = [50, 100, 150];
    const concertDate = 20250101;
    const salesDate = 20240101;

    // Create concert
    await concertContract.createConcert(
      name,
      location,
      ticketCost,
      categorySeatNumber,
      concertDate,
      salesDate
    );

    const concertId = 1;

    const exists = await concertContract.isValidConcert(concertId);
    expect(exists).to.equal(true);

    expect(name).to.equal("Taylor Swift Day 1");
    expect(location).to.equal("National Stadium");
    expect(ticketCost.map((price) => price.toString())).to.deep.equal([
      "100",
      "200",
      "300",
    ]);
    expect(
      categorySeatNumber.map((tickets) => tickets.toString())
    ).to.deep.equal(["50", "100", "150"]);
    expect(concertDate).to.equal(20250101);
    expect(salesDate).to.equal(20240101);
  });

  // Test for updating a concert
  it("Should allow the owner to update a concert", async function () {
    const { concertContract } = await loadFixture(deployFixture);

    await joinQueueFixture(concertContract);
    await concertContract.updateConcert(
      1,
      "Updated Taylor Swift Day 1",
      "Updated National Stadium",
      [150, 250, 350, 450],
      [150, 250, 350, 450],
      3,
      4
    );
    const updatedName = await concertContract.getName(1);
    const updatedLocation = await concertContract.getLocation(1);
    const updatedTicketCostArray = await concertContract.getTicketCostArray(1);
    const updatedCategorySeatArray = await concertContract.getCategorySeatArray(
      1
    );
    const updatedConcertDate = await concertContract.getConcertDate(1);
    const updatedSalesDate = await concertContract.getSalesDate(1);

    expect(updatedName).to.equal("Updated Taylor Swift Day 1");
    expect(updatedLocation).to.equal("Updated National Stadium");
    expect(
      updatedTicketCostArray.map((price) => price.toString())
    ).to.deep.equal(["150", "250", "350", "450"]);
    expect(
      updatedCategorySeatArray.map((tickets) => tickets.toString())
    ).to.deep.equal(["150", "250", "350", "450"]);
    expect(updatedConcertDate).to.equal(3);
    expect(updatedSalesDate).to.equal(4);
  });

  // Test for deleting a concert and checking whether it exists or not
  it("Should confirm that a concert no longer exists after deletion", async function () {
    const { concertContract } = await loadFixture(deployFixture);

    await concertContract.createConcert(
      "Deletable Concert",
      "Test Venue",
      [100, 200, 300], // ticketCost array
      [50, 50, 50], // categorySeatNumber array
      20250101,
      20240101
    );

    const concertId = 1;

    const initialStage = await concertContract.getConcertStage(concertId);
    expect(initialStage).to.equal(0);
    await concertContract.deleteConcert(concertId);

    const exists = await concertContract.isValidConcert(concertId);
    expect(exists).to.equal(false);
  });

  //test for incorrect lengths of array
  it("Should revert if ticketCost and categorySeatNumber arrays are not of the same length", async function () {
    const { concertContract } = await loadFixture(deployFixture);
    const name = "Mismatched Length Concert";
    const location = "Test Venue";
    const ticketCost = [100, 200];
    const categorySeatNumber = [50, 50, 50];
    const concertDate = 20250101;
    const salesDate = 20240101;

    await expect(
      concertContract.createConcert(
        name,
        location,
        ticketCost,
        categorySeatNumber,
        concertDate,
        salesDate
      )
    ).to.be.revertedWith(
      "ticketCost and categorySeatNumber arrays must have the same length"
    );
  });

  //test for empty arrays of ticketcost and category seatnumber
  it("Should revert if the ticketCost array is empty", async function () {
    const { concertContract } = await loadFixture(deployFixture);

    await expect(
      concertContract.createConcert(
        "Empty ticketCost Array Concert",
        "Test Venue",
        [], // Empty ticketCost array
        [50, 50, 50],
        20250101,
        20240101
      )
    ).to.be.revertedWith("ticketCost array cannot be empty");
  });

  //check if the categoryseatnumber array is empty
  it("Should revert if the categorySeatNumber array is empty", async function () {
    const { concertContract } = await loadFixture(deployFixture);

    await expect(
      concertContract.createConcert(
        "Empty categorySeatNumber Array Concert",
        "Test Venue",
        [100, 200, 300],
        [], // Empty categorySeatNumber array
        20250101,
        20240101
      )
    ).to.be.revertedWith("categorySeatNumber array cannot be empty");
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

    await joinQueueFixture(concertContract); // Ensure there are concerts to work with
    // Attempt to delete a concert as a non-owner
    await expect(
      concertContract.connect(addr1).deleteConcert(1)
    ).to.be.revertedWith("Caller is not the owner");
  });

  //test for getting the seat cost
  it("Should return the correct seat cost based on seat number", async function () {
    const { concertContract } = await loadFixture(deployFixture);

    await joinQueueFixture(concertContract);

    const costForSeat1 = await concertContract.getSeatCost(1, 1);
    expect(costForSeat1).to.equal(THREE_ETH); //

    const costForSeat101 = await concertContract.getSeatCost(1, 11); // 101st seat, should be in the second category
    expect(costForSeat101).to.equal(TWO_ETH);
  });

  //test for getConcertID
  it("Should return the same concert ID if the concert exists", async function () {
    const { concertContract } = await loadFixture(deployFixture);
    await joinQueueFixture(concertContract);

    // Check that the function returns the correct concert ID for an existing concert
    const concertIdForDay1 = await concertContract.getConcertID(1);
    expect(concertIdForDay1).to.equal(1);

    const concertIdForDay2 = await concertContract.getConcertID(2);
    expect(concertIdForDay2).to.equal(2);
  });

  //test for gettingTotalTickets
  it("Should return the total number of correct tickets", async function () {
    const { concertContract } = await loadFixture(deployFixture);
    await joinQueueFixture(concertContract);
    const concertTotalTicketsForDay1 = await concertContract.getTotalTickets(1);
    expect(concertTotalTicketsForDay1).to.equal(60);
    //double check with the group about how the category tickets are formed
  });

  //test for getting category tickets
  it("Should return the total number of correct tickets for a certain category", async function () {
    const { concertContract } = await loadFixture(deployFixture);
    await joinQueueFixture(concertContract);

    // Checking for category 1 in concert 1 to be equal to 100
    const concertTotalTicketsForCategory1Day1 =
      await concertContract.getTotalTicketsForCategory(1, 1);
    expect(concertTotalTicketsForCategory1Day1).to.equal(10);

    // Checking for category 1 in concert 2 to be equal to 100
    const concertTotalTicketsForCategory1Day2 =
      await concertContract.getTotalTicketsForCategory(2, 1);
    expect(concertTotalTicketsForCategory1Day2).to.equal(10);
  });

  //test for returning a concert ID
  it("Should return true for a valid concert ID", async function () {
    const { concertContract } = await loadFixture(deployFixture);
    await joinQueueFixture(concertContract);

    // Assuming concert with ID 1 is created in the fixture
    const isValid = await concertContract.isValidConcert(1);
    expect(isValid).to.be.true;
  });

  it("Should not allow deletion of a concert at PRIMARY_SALE stage", async function () {
    const { concertContract } = await loadFixture(deployFixture);
    await concertContract.createConcert(
      "Concert at Initialization",
      "Venue",
      [100, 200, 300],
      [50, 50, 50],
      20250101,
      20240101
    );

    const concertId = 1; // Assuming concert IDs start at 1 and increment

    // Update the concert's stage to PRIMARY_SALE by calling updateConcertStage once
    await concertContract.updateConcertStage(concertId);

    // Verify concert is now at PRIMARY_SALE stage
    const currentStage = await concertContract.getConcertStage(concertId);
    expect(currentStage).to.equal(1); // Assuming '1' corresponds to PRIMARY_SALE in your Stage enum

    // Attempt to delete the concert, expecting the transaction to revert
    await expect(concertContract.deleteConcert(concertId)).to.be.revertedWith(
      "Concert can only be deleted at INITIALIZATION stage"
    );
  });

  it("Get concerts at primary sales stage", async function () {
    const { concertContract, addr1 } = await loadFixture(deployFixture);
    const joinQueueFixtureArrow = async () => joinQueueFixture(concertContract);
    await loadFixture(joinQueueFixtureArrow);

    const primarySalesConcerts = await concertContract.getConcertsByStage(1);
    expect(primarySalesConcerts.length).to.equal(2);
  });
});
