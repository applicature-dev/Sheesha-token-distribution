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
const Drife = artifacts.require("DRIFE");
const identity = EthCrypto.createIdentity();

contract("DRIFE", function (accounts) {
    [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;

    const startDate = Math.round(Date.now() / 1000);
    const aDay = 86400;
    const aMonth = aDay * 30;
    const vestingDuration = aMonth * 12;
    const vestingTime = startDate + vestingDuration;
    const percentage = ether("100");
    const periods = 360;
    const everyDayReleasePercentage = new BN(percentage.toString()).div(new BN(periods.toString()));
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
        rewardToken = await MockErc20.new(ether("3000"), { from: owner });
        drife = await Drife.new(identity.address, rewardToken.address, startDate, ether("3000"));
        DRIFE = drife.address;
        await rewardToken.transfer(drife.address, ether("3000"));
    });

    after(async function () {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("DRIFE Distribution Initializing Phase Test Cases", function () {
        it("should initialize vesting with correct start date", async () => {
            (await drife.startDate()).should.be.bignumber.equal(startDate.toString());
        });

        it("should initialize vesting with correct duration", async () => {
            (await drife.VESTING_DURATION()).should.be.bignumber.equal(vestingDuration.toString());
        });

        it("should initialize vesting with correct total time", async () => {
            (await drife.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
        });

        it("should initialize vesting with correct monthly percentage", async () => {
            (await drife.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
        });

        it("shouldn\'t initialize vesting with empty signer address", async () => {
            await expectRevert(
                Drife.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, ether("3000")),
                "Invalid signer address"
            );
        });

        it("shouldn\'t initialize vesting with empty reward token address", async () => {
            await expectRevert(
                Drife.new(identity.address, constants.ZERO_ADDRESS, startDate, ether("3000")),
                "Invalid reward token address"
            );
        });

        it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
            await expectRevert(
                Drife.new(identity.address, rewardToken.address, 0, ether("3000")),
                "TGE timestamp can't be 0"
            );
        });

        it("shouldn\'t initialize vesting with zero token rewards", async () => {
            await expectRevert(
                Drife.new(identity.address, rewardToken.address, startDate, ether("0")),
                "The number of tokens for distribution cannot be 0"
            );
        });

    });

    describe("DRIFE Distribution Withdraw Phase Test Cases", function () {
        it("should release tokens correct", async () => {
            totalAllocatedAmount = new BN(await rewardToken.balanceOf(DRIFE));
            tokensForNative = totalAllocatedAmount.div(new BN(3));
            tokensForLP = totalAllocatedAmount.sub(tokensForNative);
            (await drife.totalAllocatedAmount()).should.be.bignumber.equal(totalAllocatedAmount);
            (await drife.tokensForNative()).should.be.bignumber.equal(tokensForNative);
            (await drife.tokensForLP()).should.be.bignumber.equal(tokensForLP);
        });

        it('shouldn\'t withdraw rewards before start date', async () => {
            startDateNew = startDate + vestingDuration;
            rewardToken = await MockErc20.new(ether("3000"), { from: owner });
            drife = await Drife.new(identity.address, rewardToken.address, startDateNew, ether("3000"));
            DRIFE = drife.address;
            await rewardToken.transfer(drife.address, ether("3000"));
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                drife.withdrawReward(
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

        it('should withdraw rewards before vesting ends correctly', async () => {
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await timeMachine.advanceTime(aMonth * 6);
            result = await drife.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.most(ether("250"));
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.least(ether("249.9999"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1 })
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
            await timeMachine.advanceTime(aMonth * 13);
            result = await drife.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") })
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
                drife.withdrawReward(
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
            result = await drife.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") });

            await expectRevert(
                drife.withdrawReward(
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
            await drife.changeSignerList(newSigner.address, true);
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(newSigner.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            result = await drife.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") });
        });

        it('shouldn\'t add signer with zero address', async () => {
            await expectRevert(
                drife.changeSignerList(constants.ZERO_ADDRESS, true),
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
            await timeMachine.advanceTime(aMonth * 10);
            await expectRevert(
                drife.withdrawReward(
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
            result = await drife.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("500"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("500") })

            message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary2 },
                { type: "uint256", value: highPercentageLP },
                { type: "uint256", value: highPercentageNative },
                { type: "uint256", value: "0" },
            ]);
            signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                drife.withdrawReward(
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

        it('should withdraw any erc20 send accidentally to the contract', async () => {
            amount = ether("1000");
            erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
            await erc20.transfer(DRIFE, amount, { from: beneficiary1 });
            await drife.withdrawERC20(erc20.address, amount);
            (await erc20.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
        });

        it('shouldn\'t withdraw tokens if insufficient tokens balance in contract', async () => {
            amount = ether("1000");
            erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
            await erc20.transfer(DRIFE, amount, { from: beneficiary1 });
            await expectRevert(
                drife.withdrawERC20(erc20.address, ether("3000")),
                "Insufficient tokens balance"
            );
        });
    })
})