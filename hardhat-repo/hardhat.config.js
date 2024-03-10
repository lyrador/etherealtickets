require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    // ganache: {
    //     url: "http://127.0.0.1:7545", // or whatever your Ganache RPC URL is,
    //     // accounts: {
    //     //   mnemonic: "cart connect weekend party hotel man super analyst dismiss coach ginger lend"
    //     // }
    // },
    hardhat: {
    },
  },
  solidity: "0.8.24",
};