const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const BigNumber = require("bignumber.js");

const ONE_ETH = ethers.parseEther("1.0");
const TWO_ETH = ethers.parseEther("2.0");

describe("SecondaryMarketplace", function () {
    // Stage enum numeric values => 0: INITIALIZATION, 1: PRIMARY_SALE, 2: SECONDARY_SALE, 3: OPEN, 4: COMPLETED
    const stages = {
        INITIALIZATION: BigInt("0"),
        PRIMARY_SALE: BigInt("1"),
        SECONDARY_SALE: BigInt("2"), 
        OPEN: BigInt("3"),
        COMPLETED: BigInt("4")
    }

    // Deploy Contracts and get Signers here
    async function deployFixture() {
        // addr1 will be the original buyer of the tickets. He will sell the ticket bought later on.
        // addr2 will be the new buyer of the ticket in the secondary marketplace.
        const [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy contracts
        const concertContract = await ethers.deployContract("Concert");
        const ticketContract = await ethers.deployContract("Ticket", [
            concertContract.target,
            "EtherealTickets",
            "ET",
        ]);
        const primaryMarketContract = await ethers.deployContract("Marketplace", [
            concertContract.target,
            ticketContract.target,
        ]);
        const secondaryMarketContract = await ethers.deployContract("SecondaryMarketplace", [
            concertContract.target,
            ticketContract.target,
            primaryMarketContract.target
        ]);

        // Return contracts and accounts to be used for tests
        return { concertContract, ticketContract, primaryMarketContract, secondaryMarketContract, owner, addr1, addr2 };
    }

    // Create concertContract called Eras at Stadium, with 1 category, 1 seat and it cost 2 ether. Concert on 12 dec 2024, sales on 10 oct 2024.
    async function createTestConcertFixture(concertContract) {
        await concertContract.createConcert("Eras", "Stadium", [ONE_ETH], [1], 12122024,10102024);
    }

    // Setup prerequisites for SecondaryMarket -> Create concert, create primaryMarket and have a ticket bought during primary sale.
    async function setupPrerequisitesForSecondaryMarketFixture(concertContract, ticketContract, primaryMarketContract, addr1) {
        // Create test concert
        await createTestConcertFixture(concertContract);

        // Verify that concertContract is created correctly at initialization stage
        expect(await concertContract.getConcertID(1)).to.equal(1);
        expect(await concertContract.getConcertStage(1)).to.equal(stages.INITIALIZATION);
        expect((await concertContract.getSeatCost(1, 1))).to.equal(ONE_ETH);

        // Verify that cannot join queue if stage not PRIMARY_SALE
        await expect(primaryMarketContract.connect(addr1).joinQueue(1)).to.be.revertedWith("Primary marketplace is closed");

        // Update concert stage to PRIMARY_SALE
        await concertContract.updateConcertStage(1);

        // Verify that stage is updated to PRIMARY_SALE
        expect(await concertContract.getConcertStage(1)).to.equal(stages.PRIMARY_SALE);

        // Use this constant ticket cost to set price of ticket for testing, set commission fee for buying ticket
        const standardisedTicketCost = ONE_ETH;
        const commissionFeePrimaryMarket = 0;

        // Buy ticket from primary marketplace
        await primaryMarketContract.connect(addr1).joinQueue(1);
        const initialBuyerBal = await ethers.provider.getBalance(addr1); // Get initial buyer balance before buying ticket
        let buyTicketTx = await primaryMarketContract.connect(addr1).buyTicket(1, [1], ["S1234567A"], {value: standardisedTicketCost});

        // Calculate gas cost for buy ticket transactions
        const buyTicketTxReceipt = await buyTicketTx.wait();
        const buyTicketGas = buyTicketTxReceipt.gasUsed * buyTicketTxReceipt.gasPrice;

        // Verify that ticket owner has bought ticket successfully
        expect(await ticketContract.ownerOf(1)).to.equal(addr1);
        const finalBuyerBal = await ethers.provider.getBalance(addr1);
        expect(finalBuyerBal).to.equal(initialBuyerBal - standardisedTicketCost - BigInt(commissionFeePrimaryMarket) - buyTicketGas);
    }

    async function deployContractsAndSetupPrerequisitesForSecondaryMarketFixture() {
        const { concertContract, ticketContract, primaryMarketContract, secondaryMarketContract, owner, addr1, addr2 } = await loadFixture(deployFixture);
        const setupPrerequisitesForSecondaryMarketFixtureLoader = async () => 
            setupPrerequisitesForSecondaryMarketFixture(concertContract, ticketContract, primaryMarketContract, addr1);
        await loadFixture(setupPrerequisitesForSecondaryMarketFixtureLoader);

        return { concertContract, ticketContract, primaryMarketContract, secondaryMarketContract, owner, addr1, addr2 };
    }

    describe("Secondary Market Creation", function () {
        it("Should create secondary market", async function () {
            // Deploy
            const { 
                concertContract, 
                secondaryMarketContract, 
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;

            // Verify that stage is updated to SECONDARY_SALE
            expect(
                await concertContract.getConcertStage(1)
            ).to.equal(stages.SECONDARY_SALE); 
    
            // Verify that secondary marketplace can be created successfully
            await secondaryMarketContract.createSecondaryMarketplace(1);
        });
        
        it("Should fail to create secondary market if secondary marketplace not open", async function () {
            // Deploy
            const { 
                secondaryMarketContract, 
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Verify that cannot create secondary marketplace if stage not SECONDARY_SALE
            await expect(
                secondaryMarketContract.createSecondaryMarketplace(1)
            ).to.be.revertedWith("Marketplace not open");
        });

        it("Should fail to create secondary market if not called by owner", async function () {
            // Deploy
            const { 
                concertContract,
                secondaryMarketContract,
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);

            // Verify that cannot create secondary marketplace if function is called by someone another than owner
            await expect(
                secondaryMarketContract.connect(addr1).createSecondaryMarketplace(1)
            ).to.be.revertedWith("Not owner of concert contract");
        });

        it("Should fail to create secondary market if invalid concertId", async function () {
            // Deploy
            const { 
                secondaryMarketContract, 
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Verify that cannot create secondary marketplace if function if concertId does not exist
            await expect(
                secondaryMarketContract.createSecondaryMarketplace(2)
            ).to.be.revertedWith("Concert does not exist");
        });
    });

    describe("List Ticket", function () {
        it("Should list ticket", async function () {
            // Deploy
            const { 
                concertContract,
                secondaryMarketContract,
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);

            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
            let listedTickets = await secondaryMarketContract.getListedTicketsFromConcert(1);
    
            // Expect listedTickets to be a non-empty array with 1 ticket of ticketId = 1
            expect(listedTickets).to.be.an('array').that.is.not.empty;
            expect(listedTickets.length).to.equal(1);
            expect(listedTickets).to.deep.include.members([BigInt("1")]);
        });

        it("Should fail to list ticket if secondary marketplace not open", async function () {
            // Deploy
            const { 
                secondaryMarketContract, 
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Verify that cannot list ticket on secondary marketplace if stage not SECONDARY_SALE
            await expect(
                secondaryMarketContract.connect(addr1).listTicket(1)
            ).to.be.revertedWith("Marketplace not open");
        });

        it("Should fail to list ticket if ticketId not valid", async function () {
            // Deploy
            const { 
                concertContract,
                ticketContract,
                secondaryMarketContract,
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);

            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);
    
            // Verify that cannot list ticket if ticketId not valid
            await expect(
                secondaryMarketContract.connect(addr1).listTicket(9999)
            ).to.be.revertedWithCustomError(ticketContract, "ERC721NonexistentToken");
        });

        it("Should fail to list ticket if not called by owner", async function () {
            // Deploy
            const { 
                concertContract,
                secondaryMarketContract,
                addr2
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);

            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);
            
            // Verify that cannot list ticket if function is called by someone another than owner
            await expect(
                secondaryMarketContract.connect(addr2).listTicket(1)
            ).to.be.revertedWith("Not owner of ticket");
        });
    });

    describe("Unlist Ticket", function () {
        it("Should unlist ticket", async function () {
            // Deploy
            const { 
                concertContract,
                secondaryMarketContract,
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);

            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
    
            // Unlist ticket from acct 1, who has previously listed ticket
            await secondaryMarketContract.connect(addr1).unlistTicket(1);
    
            // Expect listedTickets to be an empty array since ticket has been unlisted
            let unlistedTickets = await secondaryMarketContract.getListedTicketsFromConcert(1);
            expect(unlistedTickets).to.be.an('array').that.is.empty;
        });

        it("Should fail to unlist ticket if secondary marketplace not open", async function () {
            // Deploy
            const { 
                secondaryMarketContract, 
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Verify that cannot unlist ticket on secondary marketplace if stage not SECONDARY_SALE
            await expect(
                secondaryMarketContract.connect(addr1).unlistTicket(1)
            ).to.be.revertedWith("Marketplace not open");
        });

        it("Should fail to unlist ticket if ticketId not valid", async function () {
            // Deploy
            const { 
                concertContract,
                ticketContract,
                secondaryMarketContract,
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;
    
            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
    
            // Verify that cannot list ticket if ticketId not valid
            await expect(
                secondaryMarketContract.connect(addr1).unlistTicket(9999)
            ).to.be.revertedWithCustomError(ticketContract, "ERC721NonexistentToken");
        });

        it("Should fail to unlist ticket if not called by owner", async function () {
            // Deploy
            const { 
                concertContract,
                secondaryMarketContract,
                addr1,
                addr2
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;
    
            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
            
            // Verify that cannot unlist ticket if function is called by someone another than owner
            await expect(
                secondaryMarketContract.connect(addr2).listTicket(1)
            ).to.be.revertedWith("Not owner of ticket");
        });
    });

    describe("Buy Ticket", function () {
        it("Should buy ticket", async function () {
            // Deploy
            const { 
                concertContract,
                ticketContract,
                secondaryMarketContract,
                addr1,
                addr2
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;
    
            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
    
            const initialSecondaryMarketBal = await ethers.provider.getBalance(secondaryMarketContract);
            expect(initialSecondaryMarketBal).to.equal(0);
            const initialSellerBal = await ethers.provider.getBalance(addr1);
            const initialBuyerBal = await ethers.provider.getBalance(addr2);
    
            const ticketCost = ONE_ETH;
    
            // Case where buy transaction is successful
            let approvalTx = await ticketContract.connect(addr1).setApprovalForAll(secondaryMarketContract, true);
            let buyTicketTx = await secondaryMarketContract.connect(addr2).buyTicket(1, {value: TWO_ETH});
    
            const approvalTxReceipt = await approvalTx.wait();
            const approvalGas = approvalTxReceipt.gasUsed * approvalTxReceipt.gasPrice;
    
            const buyTicketTxReceipt = await buyTicketTx.wait();
            const buyTicketGas = buyTicketTxReceipt.gasUsed * buyTicketTxReceipt.gasPrice;
    
            // Check that ticket has been transferred to buyer, no more tickets listed
            expect(await ticketContract.ownerOf(1)).to.equal(addr2);
            expect(await secondaryMarketContract.getListedTicketsFromConcert(1)).to.be.an('array').that.is.empty;
    
            // Check the balance of the contract after receiving Ether
            const finalSecondaryMarketBal = await ethers.provider.getBalance(secondaryMarketContract);
            const finalSellerBal = await ethers.provider.getBalance(addr1);
            const finalBuyerBal = await ethers.provider.getBalance(addr2);
    
            expect(finalSecondaryMarketBal).to.equal(1000); //buying + selling commission
            expect(finalSellerBal).to.equal(initialSellerBal - BigInt(500) + ticketCost - approvalGas);
            expect(finalBuyerBal).to.equal(initialBuyerBal - BigInt(500) - ticketCost - buyTicketGas);
        });

        it("Should fail to buy ticket if insufficient amount sent", async function () {
            // Deploy
            const { 
                concertContract,
                ticketContract,
                secondaryMarketContract,
                addr1,
                addr2
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;
    
            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
    
            // Expect buy to fail if not enough money (buying and selling commission are 500 wei each)
            let approvalTx = await ticketContract.connect(addr1).setApprovalForAll(secondaryMarketContract, true);
            let buy = secondaryMarketContract.connect(addr2).buyTicket(1, {value: ONE_ETH});
    
            await expect(buy).to.be.revertedWith(
                "Insufficient amount to buy"
            );
        });

        it("Should fail to buy ticket if secondary marketplace not open", async function () {
            // Deploy
            const { 
                ticketContract,
                secondaryMarketContract, 
                addr1,
                addr2
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Verify that cannot buy ticket on secondary marketplace if stage not SECONDARY_SALE
            let approvalTx = await ticketContract.connect(addr1).setApprovalForAll(secondaryMarketContract, true);
            await expect(
                secondaryMarketContract.connect(addr2).buyTicket(1)
            ).to.be.revertedWith("Marketplace not open");
        });

        it("Should fail to buy ticket if ticketId not valid", async function () {
            // Deploy
            const { 
                concertContract,
                ticketContract,
                secondaryMarketContract,
                addr1,
                addr2
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;
    
            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
    
            // Verify that cannot buy ticket if ticketId not valid
            let approvalTx = await ticketContract.connect(addr1).setApprovalForAll(secondaryMarketContract, true);
            await expect(
                secondaryMarketContract.connect(addr2).buyTicket(9999)
            ).to.be.revertedWithCustomError(ticketContract, "ERC721NonexistentToken");
        });

        it("Should fail to buy ticket if owner is buying own listed ticket", async function () {
            // Deploy
            const { 
                concertContract,
                ticketContract,
                secondaryMarketContract,
                addr1
            } = await loadFixture(deployContractsAndSetupPrerequisitesForSecondaryMarketFixture);

            // Update concert stage to SECONDARY_SALE
            await concertContract.updateConcertStage(1);;
    
            // Create secondary marketplace for given concertId
            await secondaryMarketContract.createSecondaryMarketplace(1);

            // List ticket from address 1, who has previously bought ticket
            await secondaryMarketContract.connect(addr1).listTicket(1);
            
            // Verify that cannot buy ticket if owner is buying his/her own listed ticket
            let approvalTx = await ticketContract.connect(addr1).setApprovalForAll(secondaryMarketContract, true);
            await expect(
                secondaryMarketContract.connect(addr1).buyTicket(1)
            ).to.be.revertedWith("Owner cannot buy own listed ticket");
        });
    });
});