// const {
//     constants,
//     expectRevert,
//     ether
// } = require("@openzeppelin/test-helpers");

// const BN = require("bn.js");

// require("chai")
//     .use(require("chai-as-promised"))
//     .use(require("chai-bn")(BN))
//     .should();

// const EthCrypto = require("eth-crypto");

// const MockErc20 = artifacts.require("MockErc20");
// const DRIFE = artifacts.require("DRIFE");
// const identity = EthCrypto.createIdentity();

// contract("DRIFE", function (accounts) {
//     [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;
//     const aDay = 86400;
//     const aMonth = aDay * 30;
//     const vestingDuration = aMonth * 3;
//     const startDate = Math.round((Date.now() / 1000) + aDay);
//     const vestingTime = startDate + vestingDuration;
//     const percentage = ether("100");
//     const periods = 90;
//     const everyDayReleasePercentage = new BN(percentage.toString()).div(new BN(periods.toString()));

//     before(async function () {
//         rewardToken = await MockErc20.new(ether("3000"), { from: owner });
//         drife = await DRIFE.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("3000"));
//         D = drife.address;
//         await rewardToken.transfer(D, ether("3000"));
//     });

//     describe("DRIFE Distribution Initializing Phase Test Cases", function () {
//         it("should initialize vesting with correct start date", async () => {
//             (await drife.startDate()).should.be.bignumber.equal(startDate.toString());
//         });

//         it("should initialize vesting with correct duration", async () => {
//             (await drife.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
//         });

//         it("should initialize vesting with correct total time", async () => {
//             (await drife.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
//         });

//         it("should initialize vesting with correct monthly percentage", async () => {
//             (await drife.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
//         });

//         it("shouldn\'t initialize vesting with empty signer address", async () => {
//             await expectRevert(
//                 DRIFE.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, vestingDuration, ether("3000")),
//                 "Invalid signer address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty reward token address", async () => {
//             await expectRevert(
//                 DRIFE.new(identity.address, constants.ZERO_ADDRESS, startDate, vestingDuration, ether("3000")),
//                 "Invalid reward token address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
//             await expectRevert(
//                 DRIFE.new(identity.address, rewardToken.address, 0, vestingDuration, ether("3000")),
//                 "TGE timestamp can't be less than block timestamp"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty vesting duration", async () => {
//             await expectRevert(
//                 DRIFE.new(identity.address, rewardToken.address, startDate, 0, ether("3000")),
//                 "The vesting duration cannot be 0"
//             );
//         });

//         it("shouldn\'t initialize vesting with zero token rewards", async () => {
//             await expectRevert(
//                 DRIFE.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("0")),
//                 "The number of tokens for distribution cannot be 0"
//             );
//         });
//     });
// })