// const { expect } = require("chai");

// describe("EtherConsumer", function () {
//     let EtherConsumer;
//     let etherConsumer;
//     let owner;
//     let addr1;

//     beforeEach(async function () {
//         // Get the ContractFactory and Signers here.
//         EtherConsumer = await ethers.getContractFactory("EtherConsumer");
//         [owner, addr1] = await ethers.getSigners();

//         console.log(addr1);
//         // To deploy our contract, we just call EtherConsumer.deploy() and await for it to be deployed(), which happens once its transaction has been mined.
//         etherConsumer = await EtherConsumer.deploy();
//         //await etherConsumer.deployed();
//         console.log("EtherConsumer deployed to:", etherConsumer.target);
//     });

//     // Test case
//     it("should consume Ether", async function () {
//         const initialBalance = await ethers.provider.getBalance(etherConsumer.target);
//         expect(initialBalance).to.equal(0);

//         // Sending 1 Ether to EtherConsumer contract from addr1
//         const sendValue = ethers.parseEther("1.0"); // 1 Ether
//         const tx = await addr1.sendTransaction({
//             to: etherConsumer.target,
//             value: sendValue,
//         });
//         await tx.wait(); // Wait for the transaction to be mined

//         // Check the balance of the contract after receiving Ether
//         const finalBalance = await ethers.provider.getBalance(etherConsumer.target);
//         expect(finalBalance).to.equal(sendValue);
//     });
// });