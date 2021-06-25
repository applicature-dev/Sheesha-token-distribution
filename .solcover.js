module.exports = {
  client: require('ganache-cli'),
  providerOptions: {
    port: 8545,
  },
  skipFiles: ["mock", "Migrations"],
};