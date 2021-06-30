const {
    expect,
    expectEvent,
    constants,
    expectRevert,
    ether
} = require("@openzeppelin/test-helpers");

const BN = require("bn.js");

require("chai")
    .use(require("chai-as-promised"))
    .use(require("chai-bn")(BN))
    .should();

const timeMachine = require("ganache-time-traveler");
const EthCrypto = require("eth-crypto");

const MockErc20 = artifacts.require("MockErc20");
const TeraBlock = artifacts.require("TeraBlock");
const identity = EthCrypto.createIdentity();

contract("TeraBlock", function (accounts) {
    [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;

    const startDate = Math.round(Date.now() / 1000);
    const aDay = 86400;
    const aMonth = aDay * 30;
    const tgePercentage = ether("10");
    const remeaningPercentage = ether("90");
    const cliffDuration = aMonth * 1;
    const vestingDuration = aMonth * 10;
    const firstRelease = startDate + cliffDuration;
    const vestingTime = firstRelease + vestingDuration;
    const periods = 300;
    const everyDayReleasePercentage = new BN(remeaningPercentage.toString()).div(new BN(periods.toString()));
    const percentageNative = "10000000000000000000";
    const percentageLp = "20000000000000000000";
    const tooHighPercentage = "1000000000000000000000";
    const highPercentageNative = "95000000000000000000";
    const highPercentageLP = "85000000000000000000";

    before(async function () {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot['result'];
    });

    beforeEach(async function () {
        rewardToken = await MockErc20.new(ether("9000"), { from: owner });
        teraBlock = await TeraBlock.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("9000"));
        TB = teraBlock.address;
        await rewardToken.transfer(TB, ether("9000"));
    });

    after(async function () {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("TeraBlock Distribution Initializing Phase Test Cases", function () {
        it("should initialize vesting with correct start date", async () => {
            (await teraBlock.startDate()).should.be.bignumber.equal(startDate.toString());
        });

        it("should initialize vesting with correct cliff", async () => {
            (await teraBlock.cliffDuration()).should.be.bignumber.equal(cliffDuration.toString());
        });

        it("should initialize vesting with correct duration", async () => {
            (await teraBlock.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
        });

        it("should initialize vesting with correct first release date", async () => {
            (await teraBlock.firstRelease()).should.be.bignumber.equal(firstRelease.toString());
        });

        it("should initialize vesting with correct total time", async () => {
            (await teraBlock.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
        });

        it("should initialize vesting with correct tge percentage", async () => {
            (await teraBlock.tgePercentage()).should.be.bignumber.equal(tgePercentage);
        });

        it("should initialize vesting with correct remaining percentage", async () => {
            (await teraBlock.remainingPercentage()).should.be.bignumber.equal(ether("90"));
        });

        it("should initialize vesting with correct monthly percentage", async () => {
            (await teraBlock.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
        });

        it("shouldn\'t initialize vesting with empty signer address", async () => {
            await expectRevert(
                TeraBlock.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("9000")),
                "Invalid signer address"
            );
        });

        it("shouldn\'t initialize vesting with empty reward token address", async () => {
            await expectRevert(
                TeraBlock.new(identity.address, constants.ZERO_ADDRESS, startDate, cliffDuration, vestingDuration, tgePercentage, ether("9000")),
                "Invalid reward token address"
            );
        });

        it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
            await expectRevert(
                TeraBlock.new(identity.address, rewardToken.address, 0, cliffDuration, vestingDuration, tgePercentage, ether("9000")),
                "TGE timestamp can't be 0"
            );
        });

        it("shouldn\'t initialize vesting with empty cliff/vesting duration", async () => {
            await expectRevert(
                TeraBlock.new(identity.address, rewardToken.address, startDate, 0, vestingDuration, tgePercentage, ether("9000")),
                "The vesting and cliff duration cannot be 0"
            );

            await expectRevert(
                TeraBlock.new(identity.address, rewardToken.address, startDate, cliffDuration, 0, tgePercentage, ether("9000")),
                "The vesting and cliff duration cannot be 0"
            );
        });

        it("shouldn\'t initialize vesting with empty tge tpercentage", async () => {
            await expectRevert(
                TeraBlock.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, ether("0"), ether("9000")),
                "The tgePercentage cannot be 0"
            );
        });

        it("shouldn\'t initialize vesting with zero token rewards", async () => {
            await expectRevert(
                TeraBlock.new(identity.address, rewardToken.address, startDate, cliffDuration, vestingDuration, tgePercentage, ether("0")),
                "The number of tokens for distribution cannot be 0"
            );
        });

    });

    describe("TeraBlock Distribution Withdraw Phase Test Cases", function () {
        it("should release tokens correct", async () => {
            totalAllocatedAmount = new BN(await rewardToken.balanceOf(TB));
            tokensForNative = totalAllocatedAmount.div(new BN(3));
            tokensForLP = totalAllocatedAmount.sub(tokensForNative);

            (await teraBlock.totalAllocatedAmount()).should.be.bignumber.equal(totalAllocatedAmount);
            (await teraBlock.tokensForNative()).should.be.bignumber.equal(tokensForNative);
            (await teraBlock.tokensForLP()).should.be.bignumber.equal(tokensForLP);
        });

        it('shouldn\'t withdraw rewards before start date', async () => {
            startDateNew = startDate + vestingDuration;
            rewardToken = await MockErc20.new(ether("3000"), { from: owner });
            teraBlock = await TeraBlock.new(identity.address, rewardToken.address, startDateNew, cliffDuration, vestingDuration, tgePercentage, ether("3000"));
            TB = teraBlock.address;
            await rewardToken.transfer(TB, ether("3000"));
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                teraBlock.withdrawReward(
                    percentageLp,
                    percentageNative,
                    vrs.v,
                    vrs.r,
                    vrs.s,
                    { from: beneficiary1 }
                ),
                "No rewards available"
            );
        });

        it('should withdraw rewards before cliff', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await teraBlock.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("150"));
        });

        it('should withdraw rewards after cliff correctly', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await timeMachine.advanceTime(aMonth * 4);
            result = await teraBlock.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("555"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("555") })
        });

        it('shouldn return reward balance correctly', async () => {
            actual = await teraBlock.getRewardBalance(
                beneficiary1,
                percentageLp,
                percentageNative,
                { from: beneficiary1 }
            );
            (actual).should.be.bignumber.equal(ether("555"));
        });

        it('should withdraw rewards after vesting duration correctly', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await timeMachine.advanceTime(aMonth * 11);
            result = await teraBlock.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("1500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("1500") })
        });

        it('shouldn\'t withdraw rewards with wrong signature', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "1" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                teraBlock.withdrawReward(
                    percentageLp,
                    percentageNative,
                    vrs.v,
                    vrs.r,
                    vrs.s,
                    { from: beneficiary1 }
                ),
                "Permission not granted"
            );
        });

        it('shouldn\'t withdraw rewards with one signature twice', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            result = await teraBlock.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("1500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("1500") });

            await expectRevert(
                teraBlock.withdrawReward(
                    percentageLp,
                    percentageNative,
                    vrs.v,
                    vrs.r,
                    vrs.s,
                    { from: beneficiary1 }
                ),
                "Permission not granted"
            );
        });

        it('should add new signer correctly', async () => {
            const newSigner = EthCrypto.createIdentity();
            await teraBlock.changeSignerList(newSigner.address, true);
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(newSigner.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            result = await teraBlock.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("1500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("1500") });
        });

        it('shouldn\'t add signer with zero address', async () => {
            await expectRevert(
                teraBlock.changeSignerList(constants.ZERO_ADDRESS, true),
                "Invalid signer address"
            );
        });

        it('shouldn\'t user reward be greater than 100%', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                teraBlock.withdrawReward(
                    tooHighPercentage,
                    percentageNative,
                    vrs.v,
                    vrs.r,
                    vrs.s,
                    { from: beneficiary1 }
                ),
                "The percentage cannot be greater than 100"
            );
        });

        it('shouldn\'t user reward be greater than contract balance', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            result = await teraBlock.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("1500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("1500") })

            message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary2 },
                { type: "uint256", value: highPercentageLP },
                { type: "uint256", value: highPercentageNative },
                { type: "uint256", value: "0" },
            ]);
            signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                teraBlock.withdrawReward(
                    highPercentageLP,
                    highPercentageNative,
                    vrs.v,
                    vrs.r,
                    vrs.s,
                    { from: beneficiary2 }
                ),
                "The rewards are over"
            );
        });

        it('should withdraw any bep20 send accidentally to the contract', async () => {
            amount = ether("1000");
            erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
            await erc20.transfer(TB, amount, { from: beneficiary1 });
            await teraBlock.emergencyTokenWithdraw(erc20.address, amount);
            (await erc20.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
        });

        it('shouldn\'t withdraw tokens if insufficient tokens balance in contract', async () => {
            amount = ether("1000");
            erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
            await erc20.transfer(TB, amount, { from: beneficiary1 });
            await expectRevert(
                teraBlock.emergencyTokenWithdraw(erc20.address, ether("3000")),
                "Insufficient tokens balance"
            );
        });
    })
})