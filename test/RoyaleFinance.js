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
// const RoyaleFinance = artifacts.require("RoyaleFinance");
// const identity = EthCrypto.createIdentity();

// contract("RoyaleFinance", function (accounts) {
//     [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;

//     const aDay = 86400;
//     const aMonth = aDay * 30;
//     const vestingDuration = aMonth * 3;
//     const startDate = Math.round((Date.now() / 1000) + aDay);
//     const vestingTime = startDate + vestingDuration;
//     const percentage = ether("100");
//     const periods = 90;
//     const everyDayReleasePercentage = new BN(percentage.toString()).div(new BN(periods.toString()));
//     const percentageNative = "10000000000000000000";
//     const percentageLp = "10000000000000000000";
//     const tooHighPercentage = "1000000000000000000000";
//     const highPercentageNative = "99000000000000000000";
//     const highPercentageLP = "99000000000000000000";
//     expired = (Math.round(Date.now() / 1000)).toString();


//     beforeEach(async function () {
//         let snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot['result'];
//         rewardToken = await MockErc20.new(ether("3000"), { from: owner });
//         deadline = (await time.latest() + 1000).toString();
//         royaleFinance = await RoyaleFinance.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("3000"));
//         RF = royaleFinance.address;
//         await rewardToken.transfer(RF, ether("3000"));
//     });

//     afterEach(async function () {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     describe("RoyaleFinance Distribution Initializing Phase Test Cases", function () {
//         it("should initialize vesting with correct start date", async () => {
//             (await royaleFinance.startDate()).should.be.bignumber.equal(startDate.toString());
//         });

//         it("should initialize vesting with correct duration", async () => {
//             (await royaleFinance.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
//         });

//         it("should initialize vesting with correct total time", async () => {
//             (await royaleFinance.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
//         });

//         it("should initialize vesting with correct monthly percentage", async () => {
//             (await royaleFinance.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
//         });

//         it("shouldn\'t initialize vesting with empty signer address", async () => {
//             await expectRevert(
//                 RoyaleFinance.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, vestingDuration, ether("3000")),
//                 "Invalid signer address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty reward token address", async () => {
//             await expectRevert(
//                 RoyaleFinance.new(identity.address, constants.ZERO_ADDRESS, startDate, vestingDuration, ether("3000")),
//                 "Invalid reward token address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
//             await expectRevert(
//                 RoyaleFinance.new(identity.address, rewardToken.address, 0, vestingDuration, ether("3000")),
//                 "TGE timestamp can't be less than block timestamp"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty vesting duration", async () => {
//             await expectRevert(
//                 RoyaleFinance.new(identity.address, rewardToken.address, startDate, 0, ether("3000")),
//                 "The vesting duration cannot be 0"
//             );
//         });

//         it("shouldn\'t initialize vesting with zero token rewards", async () => {
//             await expectRevert(
//                 RoyaleFinance.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("0")),
//                 "The number of tokens for distribution cannot be 0"
//             );
//         });

//     });

//     describe("RoyaleFinance Distribution Withdraw Phase Test Cases", function () {
//         it("should release tokens correct", async () => {
//             totalAllocatedAmount = new BN(await rewardToken.balanceOf(RF));
//             tokensForNative = totalAllocatedAmount.div(new BN(3));
//             tokensForLP = totalAllocatedAmount.sub(tokensForNative);
//             (await royaleFinance.totalAllocatedAmount()).should.be.bignumber.equal(totalAllocatedAmount);
//             (await royaleFinance.tokensForNative()).should.be.bignumber.equal(tokensForNative);
//             (await royaleFinance.tokensForLP()).should.be.bignumber.equal(tokensForLP);
//         });

//         it('should withdraw rewards before vesting ends correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 1.5 + aDay);
//             result = await royaleFinance.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.most(ether("150"));
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.least(ether("149.9999"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1 })
//         });

//         it('should return reward balance correctly', async () => {
//             await time.increase(aMonth * 1.5 + aDay);
//             actual = await royaleFinance.getRewardBalance(
//                 beneficiary1,
//                 percentageLp,
//                 percentageNative,
//                 { from: beneficiary1 }
//             );
//             (actual).should.be.bignumber.at.most(ether("150"));
//             (actual).should.be.bignumber.at.least(ether("149.9999"));
//         });

//         it('should withdraw rewards after vesting duration correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             result = await royaleFinance.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") });
//             reward = await royaleFinance.getRewardBalance(
//                 beneficiary1,
//                 percentageLp,
//                 percentageNative,
//                 { from: beneficiary1 }
//             );
//             reward.should.be.bignumber.equal(ether("0"));
//             message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "1" },
//                 { type: "uint256", value: deadline },
//             ]);
//             signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await expectRevert(
//                 royaleFinance.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//                 ),
//                 "No rewards available"
//             );
//         });

//         it('shouldn\'t withdraw rewards with wrong signature', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "1" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             await expectRevert(
//                 royaleFinance.withdrawReward(
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
//             message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//         });

//         it('shouldn\'t withdraw rewards with one signature twice', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             result = await royaleFinance.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") });

//             await expectRevert(
//                 royaleFinance.withdrawReward(
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
//             await royaleFinance.changeSignerList(newSigner.address, true);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(newSigner.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             result = await royaleFinance.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") });
//         });

//         it('shouldn\'t add signer with zero address', async () => {
//             await expectRevert(
//                 royaleFinance.changeSignerList(constants.ZERO_ADDRESS, true),
//                 "Invalid signer address"
//             );
//         });

//         it('shouldn\'t user reward be greater than 100%', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             await expectRevert(
//                 royaleFinance.withdrawReward(
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

//         it('shouldn\'t withdraw rewards with expired deadline', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: expired },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             await expectRevert(
//                 royaleFinance.withdrawReward(
//                     percentageLp,
//                     percentageNative,
//                     expired,
//                     vrs.v,
//                     vrs.r,
//                     vrs.s,
//                     { from: beneficiary1 }
//                 ),
//                 "Expired"
//             );
//         });

//         it('shouldn\'t user reward be greater than contract balance', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 4);
//             result = await royaleFinance.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") })

//             message = EthCrypto.hash.keccak256([
//                 { type: "address", value: RF },
//                 { type: "address", value: beneficiary2 },
//                 { type: "uint256", value: highPercentageLP },
//                 { type: "uint256", value: highPercentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             expected = await rewardToken.balanceOf(RF);
//             reward = await royaleFinance.getRewardBalance(
//                 beneficiary2,
//                 highPercentageLP,
//                 highPercentageNative,
//                 { from: beneficiary2 }
//             );
//             reward.should.be.bignumber.equal(expected);
//             result = await royaleFinance.withdrawReward(
//                 highPercentageLP,
//                 highPercentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary2 }
//             );
//             expectEvent(result, "RewardPaid", { investor: beneficiary2, amount: expected });
//             (await rewardToken.balanceOf(RF)).should.be.bignumber.equal(ether("0"));
//         });

//         it('should withdraw any erc20 send accidentally to the contract', async () => {
//             await timeMachine.advanceTime(aMonth * 4);
//             amount = ether("1000");
//             erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
//             await erc20.transfer(RF, amount, { from: beneficiary1 });
//             await royaleFinance.emergencyTokenWithdraw(erc20.address, amount);
//             (await erc20.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
//         });

//         it('shouldn\'t withdraw tokens if insufficient tokens balance in contract', async () => {
//             await timeMachine.advanceTime(aMonth * 4);
//             amount = ether("1000");
//             erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
//             await erc20.transfer(RF, amount, { from: beneficiary1 });
//             await expectRevert(
//                 royaleFinance.emergencyTokenWithdraw(erc20.address, ether("3000")),
//                 "Insufficient tokens balance"
//             );
//         });
//     })
// })