let HDWalletProvider = require("truffle-hdwallet-provider");
const dotenv = require('dotenv');
dotenv.config();


module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)  
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8545,         // <-- If you change this, also set the port option in .solcover.js.
      // gas: 0xfffffffffff, // <-- Use this high gas value
      // gasPrice: 0x01      // <-- Use this low gas price
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider([process.env.PRIVATE_KEY], `https://ropsten.infura.io/v3/${process.env.PROJECT_ID}`)
      },
      network_id: 3,  
      gas: 4000000,
      gasPrice: 21000000000
    },
    mainnet: {
      provider:function () {
        return new HDWalletProvider([process.env.PRIVATE_KEY], `https://mainnet.infura.io/v3/${process.env.PROJECT_ID}`)
      },     
      network_id: 1,
      gas: 3000000,
      gasPrice: 180000000000,
      skipDryRun: true,
    },

  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_KEY,
  },
  compilers: {
    solc: {
      version: "0.7.6",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  },
  plugins: ["solidity-coverage", "truffle-plugin-verify"]
}

