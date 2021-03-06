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
// const DeFire = artifacts.require("DeFire");
// const identity = EthCrypto.createIdentity();

// contract("DeFire", function (accounts) {
//     [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;
//     const aDay = 86400;
//     const aMonth = aDay * 30;
//     const cliffDuration = aMonth * 2;
//     const vestingDuration = aMonth * 18;
//     const startDate = Math.round((Date.now() / 1000) + aDay);
//     const firstRelease = startDate + cliffDuration;
//     const vestingTime = firstRelease + vestingDuration;
//     const tgePercentage = ether("0");
//     const percentage = ether("100");
//     const periods = 540;
//     const everyDayReleasePercentage = new BN(percentage.toString()).div(new BN(periods.toString()));
//     const percentageNative = "10000000000000000000";
//     const percentageLp = "20000000000000000000";
//     const tooHighPercentage = "1000000000000000000000";
//     const highPercentageNative = "95000000000000000000";
//     const highPercentageLP = "85000000000000000000";


//     beforeEach(async function () {
//         let snapshot = await timeMachine.takeSnapshot();
//         snapshotId = snapshot['result'];
//         rewardToken = await MockErc20.new(ether("3000"), { from: owner });
//         deadline = (await time.latest() + 1000).toString();
//         expired = (Math.round(Date.now() / 1000)).toString();
//         deFire = await DeFire.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("3000"));
//         DEFIRE = deFire.address;
//         await rewardToken.transfer(DEFIRE, ether("3000"));
//     });

//     afterEach(async function () {
//         await timeMachine.revertToSnapshot(snapshotId);
//     });

//     describe("DeFire Distribution Initializing Phase Test Cases", function () {
//         it("should initialize vesting with correct start date", async () => {
//             (await deFire.startDate()).should.be.bignumber.equal(startDate.toString());
//         });

//         it("should initialize vesting with correct cliff", async () => {
//             (await deFire.cliffDuration()).should.be.bignumber.equal(cliffDuration.toString());
//         });

//         it("should initialize vesting with correct duration", async () => {
//             (await deFire.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
//         });

//         it("should initialize vesting with correct first release date", async () => {
//             (await deFire.firstRelease()).should.be.bignumber.equal(firstRelease.toString());
//         });

//         it("should initialize vesting with correct total time", async () => {
//             (await deFire.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
//         });

//         it("should initialize vesting with correct monthly percentage", async () => {
//             (await deFire.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
//         });

//         it("shouldn\'t initialize vesting with empty signer address", async () => {
//             await expectRevert(
//                 DeFire.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("3000")),
//                 "Invalid signer address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty reward token address", async () => {
//             await expectRevert(
//                 DeFire.new(identity.address, constants.ZERO_ADDRESS, startDate, cliffDuration, vestingDuration, tgePercentage, ether("3000")),
//                 "Invalid reward token address"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
//             await expectRevert(
//                 DeFire.new(identity.address, rewardToken.address, 0, cliffDuration, vestingDuration, tgePercentage, ether("3000")),
//                 "TGE timestamp can't be less than block timestamp"
//             );
//         });

//         it("shouldn\'t initialize vesting with empty vesting duration", async () => {
//             await expectRevert(
//                 DeFire.new(identity.address, rewardToken.address, startDate, cliffDuration, 0, tgePercentage, ether("9000")),
//                 "The vesting duration cannot be 0"
//             );
//         });

//         it("shouldn\'t initialize vesting with zero token rewards", async () => {
//             await expectRevert(
//                 DeFire.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("0")),
//                 "The number of tokens for distribution cannot be 0"
//             );
//         });

//     });

//     describe("DeFire Distribution Withdraw Phase Test Cases", function () {
//         it("should release tokens correct", async () => {
//             totalAllocatedAmount = new BN(await rewardToken.balanceOf(DEFIRE));
//             tokensForNative = totalAllocatedAmount.div(new BN(3));
//             tokensForLP = totalAllocatedAmount.sub(tokensForNative);

//             (await deFire.totalAllocatedAmount()).should.be.bignumber.equal(totalAllocatedAmount);
//             (await deFire.tokensForNative()).should.be.bignumber.equal(tokensForNative);
//             (await deFire.tokensForLP()).should.be.bignumber.equal(tokensForLP);
//         });

//         it('shouldn\'t withdraw rewards before cliff', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await expectRevert(
//                 deFire.withdrawReward(
//                     percentageLp,
//                     percentageNative,
//                     deadline,
//                     vrs.v,
//                     vrs.r,
//                     vrs.s,
//                     { from: beneficiary1 }
//                 ),
//                 "No rewards available"
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("0"));
//         });

//         it('should withdraw rewards after cliff correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 11 + aDay);
//             result = await deFire.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.most(ether("250"));
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.least(ether("249.9999"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1 });
//             actual = await deFire.getRewardBalance(
//                 beneficiary1,
//                 percentageLp,
//                 percentageNative,
//                 { from: beneficiary1 }
//             );
//             (actual).should.be.bignumber.at.most(ether("0"));
//         });

//         it('should return reward balance correctly', async () => {
//             await time.increase(aMonth * 11 + aDay);
//             actual = await deFire.getRewardBalance(
//                 beneficiary1,
//                 percentageLp,
//                 percentageNative,
//                 { from: beneficiary1 }
//             );
//             (actual).should.be.bignumber.at.most(ether("250"));
//             (actual).should.be.bignumber.at.least(ether("249.9999"));
//         });

//         it('should withdraw rewards after vesting duration correctly', async () => {
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await timeMachine.advanceTime(aMonth * 21);
//             result = await deFire.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") });
//         });

//         it('shouldn\'t withdraw rewards with wrong signature', async () => {
//             await timeMachine.advanceTime(aMonth * 21);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "1" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await expectRevert(
//                 deFire.withdrawReward(
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

//         it('shouldn\'t withdraw rewards with expired deadline', async () => {
//             await timeMachine.advanceTime(aMonth * 21);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: expired },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await expectRevert(
//                 deFire.withdrawReward(
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

//         it('shouldn\'t withdraw rewards with one signature twice', async () => {
//             await timeMachine.advanceTime(aMonth * 21);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             result = await deFire.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") });

//             await expectRevert(
//                 deFire.withdrawReward(
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
//             await timeMachine.advanceTime(aMonth * 21);
//             const newSigner = EthCrypto.createIdentity();
//             await deFire.changeSignerList(newSigner.address, true);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(newSigner.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             result = await deFire.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") });
//         });

//         it('shouldn\'t add signer with zero address', async () => {
//             await expectRevert(
//                 deFire.changeSignerList(constants.ZERO_ADDRESS, true),
//                 "Invalid signer address"
//             );
//         });

//         it('shouldn\'t user reward be greater than 100%', async () => {
//             await timeMachine.advanceTime(aMonth * 21);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             await expectRevert(
//                 deFire.withdrawReward(
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
//             await timeMachine.advanceTime(aMonth * 21);
//             let message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary1 },
//                 { type: "uint256", value: percentageLp },
//                 { type: "uint256", value: percentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             let signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             result = await deFire.withdrawReward(
//                 percentageLp,
//                 percentageNative,
//                 deadline,
//                 vrs.v,
//                 vrs.r,
//                 vrs.s,
//                 { from: beneficiary1 }
//             );
//             (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
//             expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") })

//             message = EthCrypto.hash.keccak256([
//                 { type: "address", value: DEFIRE },
//                 { type: "address", value: beneficiary2 },
//                 { type: "uint256", value: highPercentageLP },
//                 { type: "uint256", value: highPercentageNative },
//                 { type: "uint256", value: "0" },
//                 { type: "uint256", value: deadline },
//             ]);
//             signature = EthCrypto.sign(identity.privateKey, message);
//             vrs = EthCrypto.vrs.fromString(signature);
//             expected = await rewardToken.balanceOf(DEFIRE);
//             result = await deFire.withdrawReward(
//                     highPercentageLP,
//                     highPercentageNative,
//                     deadline,
//                     vrs.v,
//                     vrs.r,
//                     vrs.s,
//                     { from: beneficiary2 }
//                 );
//             expectEvent(result, "RewardPaid", { investor: beneficiary2, amount: expected });
//             (await rewardToken.balanceOf(DEFIRE)).should.be.bignumber.equal(ether("0"));
            
//         });

//         it('should withdraw any erc20 send accidentally to the contract', async () => {
//             await timeMachine.advanceTime(aMonth * 21);
//             amount = ether("1000");
//             erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
//             await erc20.transfer(DEFIRE, amount, { from: beneficiary1 });
//             await deFire.emergencyTokenWithdraw(erc20.address, amount);
//             (await erc20.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
//         });

//         it('shouldn\'t withdraw tokens if insufficient tokens balance in contract', async () => {
//             await timeMachine.advanceTime(aMonth * 21);
//             amount = ether("1000");
//             erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
//             await erc20.transfer(DEFIRE, amount, { from: beneficiary1 });
//             await expectRevert(
//                 deFire.emergencyTokenWithdraw(erc20.address, ether("3000")),
//                 "Insufficient tokens balance"
//             );
//         });
//     });
// })