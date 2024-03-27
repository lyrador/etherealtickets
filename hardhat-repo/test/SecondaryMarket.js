const { expect } = require("chai");
const BigNumber = require("bignumber.js");

describe("SecondaryMarketplace", function () {
    let Concert;
    let concert;
    let Ticket;
    let ticket;
    let SecondaryMarket;
    let secondaryMarket;
    let PrimaryMarket;
    let primaryMarket;

    let owner;
    let addr1; // This will be the original buyer of the tickets. He will sell the ticket bought later on.
    let addr2; // This will be the new buyer of the ticket in the secondary marketplace.

    const oneEth = ethers.parseEther("1.0");

    // Stage enum numeric values => 0: INITIALIZATION, 1: PRIMARY_SALE, 2: SECONDARY_SALE, 3: OPEN, 4: COMPLETED
    const stages = {
        INITIALIZATION: BigInt("0"),
        PRIMARY_SALE: BigInt("1"),
        SECONDARY_SALE: BigInt("2"), 
        OPEN: BigInt("3"),
        COMPLETED: BigInt("4")
    }

    // Create concert called Eras at Stadium, with 1 category, 1 seat and it cost 2 ether. Concert on 12 dec 2024, sales on 10 oct 2024.
    async function createTestConcert() {
        return await concert.createConcert("Eras", "Stadium", [oneEth], [1], 12122024,10102024);
    }

    // Update concert stage status
    async function updateTestConcertStage(concertId, stage) {
        return await concert.updateConcert(concertId, "Eras", "Stadium", [oneEth], [1], 12122024, 10102024, stage);
    }

    beforeEach(async function () {
        // Get the ContractFactory and Signers here
        Concert = await ethers.getContractFactory("Concert");
        Ticket = await ethers.getContractFactory("Ticket");
        PrimaryMarket = await ethers.getContractFactory("Marketplace");
        SecondaryMarket = await ethers.getContractFactory("SecondaryMarketplace");
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy contracts
        concert = await Concert.deploy();
        ticket = await Ticket.deploy(concert.target);
        primaryMarket = await PrimaryMarket.deploy(concert.target, ticket.target, "Marketplace", "MKT"); 
        secondaryMarket = await SecondaryMarket.deploy(concert.target, ticket.target); 

        console.log("Concert deployed to: ", concert.target);
        console.log("Ticket deployed to: ", ticket.target);
        console.log("PrimaryMarket deployed to: ", primaryMarket.target);
        console.log("SecondaryMarket deployed to: ", secondaryMarket.target);

        // ----- CONCERT AND TICKET CREATION -----
        // Create test concert
        await createTestConcert();

        // Verify that concert is created correctly at initialization stage
        expect(await concert.getConcertID(1)).to.equal(1);
        expect(await concert.getConcertStage(1)).to.equal(stages.INITIALIZATION);
        expect(await concert.getSeatCost(1, 1)).to.equal(oneEth);

        // Verify that cannot join queue if stage not PRIMARY_SALE
        await expect(primaryMarket.connect(addr1).joinQueue(1)).to.be.revertedWith("Marketplace not open");

        // Update concert stage to PRIMARY_SALE
        await updateTestConcertStage(1, stages.PRIMARY_SALE);

        // Verify that stage is updated to PRIMARY_SALE
        expect(await concert.getConcertStage(1)).to.equal(stages.PRIMARY_SALE);

        // Use this constant ticket cost to set price of ticket for testing, set commission fee for buying ticket
        const standardisedTicketCost = oneEth;
        const commissionFeePrimaryMarket = 0;

        // Buy ticket from primary marketplace
        await primaryMarket.connect(addr1).joinQueue(1);
        const initialBuyerBal = await ethers.provider.getBalance(addr1); // Get initial buyer balance before buying ticket
        let buyTicketTx = await primaryMarket.connect(addr1).buyTicket(1, [1], ["S1234567A"], {value: standardisedTicketCost});

        // Calculate gas cost for buy ticket transactions
        const buyTicketTxReceipt = await buyTicketTx.wait();
        const buyTicketGas = buyTicketTxReceipt.gasUsed * buyTicketTxReceipt.gasPrice;

        // Verify that ticket owner has bought ticket successfully
        expect(await ticket.getTicketOwner(1)).to.equal(addr1);
        const finalBuyerBal = await ethers.provider.getBalance(addr1);
        expect(finalBuyerBal).to.equal(initialBuyerBal - standardisedTicketCost - BigInt(commissionFeePrimaryMarket) - buyTicketGas);
    });

    it("Should create secondary market", async function () {
        // Verify that cannot create secondary marketplace if stage not SECONDARY_SALE
        await expect(secondaryMarket.createSecondaryMarketplace(1)).to.be.revertedWith("Marketplace not open");

        // Update concert stage to SECONDARY_SALE
        await updateTestConcertStage(1, stages.SECONDARY_SALE);

        // Verify that stage is updated to SECONDARY_SALE
        expect(await concert.getConcertStage(1)).to.equal(stages.SECONDARY_SALE); 

        // Verify that secondary marketplace can be created successfully
        await secondaryMarket.createSecondaryMarketplace(1);
    });

    it("Should list ticket", async function () {
        // Update concert stage to SECONDARY_SALE
        await updateTestConcertStage(1, stages.SECONDARY_SALE);

        // Create secondary marketplace for given concertId
        await secondaryMarket.createSecondaryMarketplace(1);

        // List ticket from address 1, who has previously bought ticket
        await secondaryMarket.connect(addr1).listTicket(1,1);
        let listedTickets = await secondaryMarket.getListedTicketsFromConcert(1);

        // Expect listedTickets to be a non-empty array with 1 ticket of ticketId = 1
        expect(listedTickets).to.be.an('array').that.is.not.empty;
        expect(listedTickets.length).to.equal(1);
        expect(listedTickets).to.deep.include.members([BigInt("1")]);
    });

    it("Should unlist ticket", async function () {
        // Update concert stage to SECONDARY_SALE
        await updateTestConcertStage(1, stages.SECONDARY_SALE);

        // Create secondary marketplace for given concertId
        await secondaryMarket.createSecondaryMarketplace(1);

        // List ticket from address 1, who has previously bought ticket
        await secondaryMarket.connect(addr1).listTicket(1,1);

        // Unlist ticket from acct 1, who has previously listed ticket
        await secondaryMarket.connect(addr1).unlistTicket(1,1);

        // Expect listedTickets to be an empty array since ticket has been unlisted
        let unlistedTickets = await secondaryMarket.getListedTicketsFromConcert(1);
        expect(unlistedTickets).to.be.an('array').that.is.empty;
    });

    // it("Should buy ticket", async function () {
    //     // update concert stage to SECONDARY_SALE
    //     let updateConcert = await concert.updateConcert(1, "Eras", "Stadium", [oneEth], [1], 12122024,10102024, BigInt("2"));
    //     //create secondary marketplace for given concertId
    //     let createSecondaryMarketplace = await secondaryMarket.createSecondaryMarketplace(1);

    //     // list ticket from acct 1, who has previously bought ticket
    //     let listed = await secondaryMarket.connect(addr1).listTicket(1,1);

    //     // expert buy to fail if not enough money (buying and selling commission are 500 wei each)
    //     let buyFail = secondaryMarket.connect(addr2).buy(1,1,{value: oneEth});

    //     await expect(buy).to.be.revertedWith(
    //         "Insufficient amount to buy"
    //     );

    //     const initialSecondaryMarketBal = await ethers.provider.getBalance(secondaryMarket.target);
    //     expect(initialSecondaryMarketBal).to.equal(0);
    //     const initialSellerBal = await ethers.provider.getBalance(addr1.target);
    //     const initialBuyerBal = await ethers.provider.getBalance(addr2.target);

    //     // Case where buy transaction is successful
    //     let buySuccess = await secondaryMarket.connect(addr2).buy(1,1,{value: oneEth*2});

    //     // Check that ticket has been transferred to buyer, no more tickets listed
    //     expect(await ticket.getTicketOwner(1)).to.equal(addr2);
    //     expect(await secondaryMarket.getListedTicketsFromConcert(1)).to.be.an('array').that.is.empty;

    //     // Check the balance of the contract after receiving Ether
    //     const finalSecondaryMarketBal = await ethers.provider.getBalance(secondaryMarket.target);
    //     const finalSellerBal = await ethers.provider.getBalance(addr1.target);
    //     const finalBuyerBal = await ethers.provider.getBalance(addr2.target);

    //     expect(finalSecondaryMarketBal).to.equal(1000); //buying + selling commission
    //     expect(finalSellerBal).to.equal(initialSellerBal - 500 + ticketCost);
    //     expect(finalBuyerBal).to.equal(initialBuyerBal - 500 - ticketCost);
    // });
});