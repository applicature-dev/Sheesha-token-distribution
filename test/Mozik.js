// const {
//     time,
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
// const Mozik = artifacts.require("Mozik");
// const identity = EthCrypto.createIdentity();

// contract("Mozik", function (accounts) {
//     [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;

//     const aDay = 86400;
//     const aMonth = aDay * 30;
//     const vestingDuration = aMonth * 12;
//     const startDate = Math.round((Date.now() / 1000) + aDay);
//     const cliffDuration = 0;
//     const vestingTime = startDate + vestingDuration;
//     const periods = 360;
//     const tgePercentage = ether("15");
//     const remeaningPercentage = ether("85");
//     const everyDayReleasePercentage = new BN(remeaningPercentage.toString()).div(new BN(periods.toString()));
//     const percentageNative = "10000000000000000000";
//     const percentageLp = "20000000000000000000";
//     const tooHighPercentage = "1000000000000000000000";
//     const highPercentageNative = "95000000000000000000";
//     const highPercentageLP = "85000000000000000000";

//     beforeEach(async function () {
//         let snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot['result'];
//         rewardToken = await MockErc20.new(ether("12000"), { from: owner });
//         deadline = (await time.latest() + 1000).toString();
//         mozik = await Mozik.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("12000"));
//         M = mozik.address;
//         await rewardToken.transfer(M, ether("12000"));
//     });

//     afterEach(async function () {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     describe("Mozik Distribution Initializing Phase Test Cases", function () {
//         it("should initialize vesting with correct start date", async () => {
//             (await mozik.startDate()).should.be.bignumber.equal(startDate.toString());
//         });

//         it("should initialize vesting with correct duration", async () => {
//             (await mozik.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
//         });

//         it("should initialize vesting with correct total time", async () => {
//             (await mozik.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
//         });

//         it("should initialize vesting with correct tge percentage", async () => {
//             (await mozik.tgePercentage()).should.be.bignumber.equal(tgePercentage);
//         });

//         it("should initialize vesting with correct monthly percentage", async () => {
//             (await mozik.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
//         });

//         it("shouldn\'t initialize vesting with empty signer address", async () => {
//             await expectRevert(
//                 Mozik.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("12000")),
//                 "Invalid signer address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty reward token address", async () => {
//             await expectRevert(
//                 Mozik.new(identity.address, constants.ZERO_ADDRESS, startDate, cliffDuration, vestingDuration, tgePercentage, ether("12000")),
//                 "Invalid reward token address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
//             await expectRevert(
//                 Mozik.new(identity.address, rewardToken.address, 0, cliffDuration, vestingDuration, tgePercentage, ether("12000")),
//                 "TGE timestamp can't be less than block timestamp"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty vesting duration", async () => {
//             await expectRevert(
//                 Mozik.new(identity.address, rewardToken.address, startDate, cliffDuration, 0, tgePercentage, ether("9000")),
//                 "The vesting duration cannot be 0"
//             );
//         });

//         it("shouldn\'t initialize vesting with the tgercentage greater than 100", async () => {
//             await expectRevert(
//                 Mozik.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, ether("110"), ether("9000")),
//                 "The tgePercentage cannot be greater than 100"
//             );
//         });

//         it("shouldn\'t initialize vesting with zero token rewards", async () => {
//             await expectRevert(
//                 Mozik.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("0")),
//                 "The number of tokens for distribution cannot be 0"
//             );
//         });

//     });

//     describe("Mozik Distribution Withdraw Phase Test Cases", function () {
//         it("should release tokens correct", async () => {
//             totalAllocatedAmount = new BN(await rewardToken.balanceOf(M));
//             tokensForNative = totalAllocatedAmount.div(new BN(3));
//             tokensForLP = totalAllocatedAmount.sub(tokensForNative);

//             (await mozik.totalAllocatedAmount()).should.be.bignumber.equal(totalAllocatedAmount);
//             (await mozik.tokensForNative()).should.be.bignumber.equal(tokensForNative);
//             (await mozik.tokensForLP()).should.be.bignumber.equal(tokensForLP);
//         });

//         it('should withdraw initial rewards correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await mozik.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
//         });

//         it('should withdraw rewards before vesting end correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4 + aDay);
//             result = await mozik.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.most(ether("866.6667"));
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.least(ether("866.6666"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1 })
//         });

//         it('should return reward balance correctly', async () => {
//             await time.increase(aMonth * 4 + aDay);
//             actual = await mozik.getRewardBalance(
//                 beneficiary1,
//                 percentageLp,
//                 percentageNative,
//                 { from: beneficiary1 }
//             );
//             (actual).should.be.bignumber.at.most(ether("866.6667"));
//             (actual).should.be.bignumber.at.least(ether("866.6666"));
//         });

//         it('should withdraw rewards after vesting duration correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 13);
//             result = await mozik.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("2000"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("2000") })
//         });

//         it('shouldn\'t withdraw rewards with wrong signature', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "1" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 13);
//             await expectRevert(
//                 mozik.withdrawReward(
//                     percentageLp,
//                     percentageNative,
//                     deadline,
//                     vrs.v,
//                     vrs.r,
//                     vrs.s,
//                     { from: beneficiary1 }
//                 ),
//                 "Permission not granted"
//             );
//         });

//         it('shouldn\'t withdraw rewards with one signature twice', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 13);
//             result = await mozik.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("2000"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("2000") });

//             await expectRevert(
//                 mozik.withdrawReward(
//                     percentageLp,
//                     percentageNative,
//                     deadline,
//                     vrs.v,
//                     vrs.r,
//                     vrs.s,
//                     { from: beneficiary1 }
//                 ),
//                 "Permission not granted"
//             );
//         });

//         it('should add new signer correctly', async () => {
//             const newSigner = EthCrypto.createIdentity();
//             await mozik.changeSignerList(newSigner.address, true);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(newSigner.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 13);
//             result = await mozik.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("2000"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("2000") });
//         });

//         it('shouldn\'t add signer with zero address', async () => {
//             await expectRevert(
//                 mozik.changeSignerList(constants.ZERO_ADDRESS, true),
//                 "Invalid signer address"
//             );
//         });

//         it('shouldn\'t user reward be greater than 100%', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 13);
//             await expectRevert(
//                 mozik.withdrawReward(
//                     tooHighPercentage,
//                     percentageNative,
//                     deadline,
//                     vrs.v,
//                     vrs.r,
//                     vrs.s,
//                     { from: beneficiary1 }
//                 ),
//                 "The percentage cannot be greater than 100"
//             );
//         });

//         it('shouldn\'t user reward be greater than contract balance', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 13);
//             result = await mozik.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("2000"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("2000") })

//             message = EthCrypto.hash.keccak256([
//                 { type: "address", value: M },
//                 { type: "address", value: beneficiary2 },
//                 { type: "uint256", value: highPercentageLP },
//                 { type: "uint256", value: highPercentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             expected = await rewardToken.balanceOf(M);
//             result = await mozik.withdrawReward(
//                 highPercentageLP,
//                 highPercentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary2 }
//             );
//             expectEvent(result, "RewardPaid", { investor: beneficiary2, amount: expected });
//             (await rewardToken.balanceOf(M)).should.be.bignumber.equal(ether("0"));
//         });

//         it('should withdraw any erc20 send accidentally to the contract', async () => {
//             await timeMachine.advanceTime(aMonth * 13);
//             amount = ether("1000");
//             erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
//             await erc20.transfer(M, amount, { from: beneficiary1 });
//             await mozik.emergencyTokenWithdraw(erc20.address, amount);
//             (await erc20.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
//         });

//         it('shouldn\'t withdraw tokens if insufficient tokens balance in contract', async () => {
//             await timeMachine.advanceTime(aMonth * 13);
//             amount = ether("1000");
//             erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
//             await erc20.transfer(M, amount, { from: beneficiary1 });
//             await expectRevert(
//                 mozik.emergencyTokenWithdraw(erc20.address, ether("3000")),
//                 "Insufficient tokens balance"
//             );
//         });
//     })
// })