// const {
//     expect,
//     expectEvent,
//     constants,
//     expectRevert,
//     ether
// } = require("@openzeppelin/test-helpers");

// const BN = require("bn.js");

// require("chai")
//     .use(require("chai-as-promised"))
//     .use(require("chai-bn")(BN))
//     .should();

// const timeMachine = require("ganache-time-traveler");
// const EthCrypto = require("eth-crypto");

// const MockErc20 = artifacts.require("MockErc20");
// const RaiinMaker = artifacts.require("RaiinMaker");
// const identity = EthCrypto.createIdentity();

// contract("RaiinMaker", function (accounts) {
//     [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;
//     const aDay = 86400;
//     const aMonth = aDay * 30;
//     const startDate = Math.round((Date.now() / 1000) + aDay);
//     const tgePercentage = ether("15");
//     const remainingPercentage = ether("85");
//     const cliffDuration = aMonth * 12;
//     const vestingDuration = aMonth * 12;
//     const firstRelease = startDate + cliffDuration;
//     const vestingTime = firstRelease + vestingDuration;
//     const periods = 360;
//     const everyDayReleasePercentage = new BN(remainingPercentage.toString()).div(new BN(periods.toString()));

//     before(async function () {
//         let snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot['result'];
//     });

//     beforeEach(async function () {
//         rewardToken = await MockErc20.new(ether("9000"), { from: owner });
//         raiinMaker = await RaiinMaker.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("9000"));
//         RM = raiinMaker.address;
//         await rewardToken.transfer(RM, ether("9000"));
//     });

//     after(async function () {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     describe("RaiinMaker Distribution Initializing Phase Test Cases", function () {
//         it("should initialize vesting with correct start date", async () => {
//             (await raiinMaker.startDate()).should.be.bignumber.equal(startDate.toString());
//         });

//         it("should initialize vesting with correct cliff", async () => {
//             (await raiinMaker.cliffDuration()).should.be.bignumber.equal(cliffDuration.toString());
//         });

//         it("should initialize vesting with correct duration", async () => {
//             (await raiinMaker.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
//         });

//         it("should initialize vesting with correct first release date", async () => {
//             (await raiinMaker.firstRelease()).should.be.bignumber.equal(firstRelease.toString());
//         });

//         it("should initialize vesting with correct total time", async () => {
//             (await raiinMaker.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
//         });

//         it("should initialize vesting with correct tge percentage", async () => {
//             (await raiinMaker.tgePercentage()).should.be.bignumber.equal(tgePercentage);
//         });

//         it("should initialize vesting with correct monthly percentage", async () => {
//             (await raiinMaker.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
//         });

//         it("shouldn\'t initialize vesting with empty signer address", async () => {
//             await expectRevert(
//                 RaiinMaker.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("9000")),
//                 "Invalid signer address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty reward token address", async () => {
//             await expectRevert(
//                 RaiinMaker.new(identity.address, constants.ZERO_ADDRESS, startDate, cliffDuration, vestingDuration, tgePercentage, ether("9000")),
//                 "Invalid reward token address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
//             await expectRevert(
//                 RaiinMaker.new(identity.address, rewardToken.address, 0, cliffDuration, vestingDuration, tgePercentage, ether("9000")),
//                 "TGE timestamp can't be less than block timestamp"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty vesting duration", async () => {
//             await expectRevert(
//                 RaiinMaker.new(identity.address, rewardToken.address, startDate, cliffDuration, 0, tgePercentage, ether("9000")),
//                 "The vesting duration cannot be 0"
//             );
//         });

//         it("shouldn\'t initialize vesting with the tgercentage greater than 100", async () => {
//             await expectRevert(
//                 RaiinMaker.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, ether("110"), ether("9000")),
//                 "The tgePercentage cannot be greater than 100"
//             );
//         });

//         it("shouldn\'t initialize vesting with zero token rewards", async () => {
//             await expectRevert(
//                 RaiinMaker.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("0")),
//                 "The number of tokens for distribution cannot be 0"
//             );
//         });

//     });
// })