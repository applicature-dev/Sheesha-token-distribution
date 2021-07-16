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
// const EqiFI = artifacts.require("EqiFI");
// const identity = EthCrypto.createIdentity();

// contract("EqiFI", function (accounts) {
//     [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;
//     const aDay = 86400;
//     const aMonth = aDay * 30;
//     const startDate = Math.round((Date.now() / 1000) + aDay);
//     const vestingDuration = aMonth * 3;
//     const vestingTime = startDate + vestingDuration;
//     const percentage = ether("100");
//     const periods = 90;
//     const everyDayReleasePercentage = new BN(percentage.toString()).div(new BN(periods.toString()));

//     before(async function () {
//         rewardToken = await MockErc20.new(ether("3000"), { from: owner });
//         eqiFI = await EqiFI.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("3000"));
//         EFI = eqiFI.address;
//         await rewardToken.transfer(EFI, ether("3000"));
//     });

//     describe("EqiFI Distribution Initializing Phase Test Cases", function () {
//         it("should initialize vesting with correct start date", async () => {
//             (await eqiFI.startDate()).should.be.bignumber.equal(startDate.toString());
//         });

//         it("should initialize vesting with correct duration", async () => {
//             (await eqiFI.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
//         });

//         it("should initialize vesting with correct total time", async () => {
//             (await eqiFI.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
//         });

//         it("should initialize vesting with correct monthly percentage", async () => {
//             (await eqiFI.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
//         });

//         it("shouldn\'t initialize vesting with empty signer address", async () => {
//             await expectRevert(
//                 EqiFI.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, vestingDuration, ether("3000")),
//                 "Invalid signer address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty reward token address", async () => {
//             await expectRevert(
//                 EqiFI.new(identity.address, constants.ZERO_ADDRESS, startDate, vestingDuration, ether("3000")),
//                 "Invalid reward token address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
//             await expectRevert(
//                 EqiFI.new(identity.address, rewardToken.address, 0, vestingDuration, ether("3000")),
//                 "TGE timestamp can't be less than block timestamp"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty vesting duration", async () => {
//             await expectRevert(
//                 EqiFI.new(identity.address, rewardToken.address, startDate, 0, ether("3000")),
//                 "The vesting duration cannot be 0"
//             );
//         });

//         it("shouldn\'t initialize vesting with zero token rewards", async () => {
//             await expectRevert(
//                 EqiFI.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("0")),
//                 "The number of tokens for distribution cannot be 0"
//             );
//         });
//     });
// })