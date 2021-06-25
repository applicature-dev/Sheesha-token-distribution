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
const Zignaly = artifacts.require("Zignaly");
const identity = EthCrypto.createIdentity();

contract("Zignaly", function (accounts) {
    [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4] = accounts;

    const startDate = Math.round(Date.now() / 1000);
    const aDay = 86400;
    const aMonth = aDay * 30;
    const vestingDuration = aMonth * 3;
    const vestingTime = startDate + vestingDuration;
    const percentage = ether("100");
    const periods = 90;
    const everyDayReleasePercentage = new BN(percentage.toString()).div(new BN(periods.toString()));
    const percentageNative = "10000000000000000000";
    const percentageLp = "10000000000000000000";
    const tooHighPercentage = "1000000000000000000000";
    const highPercentageNative = "99000000000000000000";
    const highPercentageLP = "99000000000000000000";

    before(async function () {
        let snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot['result'];
    });

    beforeEach(async function () {
        rewardToken = await MockErc20.new(ether("3000"), { from: owner });
        zignaly = await Zignaly.new(identity.address, rewardToken.address, startDate, ether("3000"));
        Z = zignaly.address;
        await rewardToken.transfer(Z, ether("3000"));
    });

    after(async function () {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    describe("Zignaly Distribution Initializing Phase Test Cases", function () {
        it("should initialize vesting with correct start date", async () => {
            (await zignaly.startDate()).should.be.bignumber.equal(startDate.toString());
        });

        it("should initialize vesting with correct duration", async () => {
            (await zignaly.VESTING_DURATION()).should.be.bignumber.equal(vestingDuration.toString());
        });

        it("should initialize vesting with correct total time", async () => {
            (await zignaly.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
        });

        it("should initialize vesting with correct monthly percentage", async () => {
            (await zignaly.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
        });

        it("shouldn\'t initialize vesting with empty signer address", async () => {
            await expectRevert(
                Zignaly.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, ether("3000")),
                "Invalid signer address"
            );
        });

        it("shouldn\'t initialize vesting with empty reward token address", async () => {
            await expectRevert(
                Zignaly.new(identity.address, constants.ZERO_ADDRESS, startDate, ether("3000")),
                "Invalid reward token address"
            );
        });

        it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
            await expectRevert(
                Zignaly.new(identity.address, rewardToken.address, 0, ether("3000")),
                "TGE timestamp can't be 0"
            );
        });

        it("shouldn\'t initialize vesting with zero token rewards", async () => {
            await expectRevert(
                Zignaly.new(identity.address, rewardToken.address, startDate, ether("0")),
                "The number of tokens for distribution cannot be 0"
            );
        });

    });

    describe("Zignaly Distribution Withdraw Phase Test Cases", function () {
        it("should release tokens correct", async () => {
            totalAllocatedAmount = new BN(await rewardToken.balanceOf(Z));
            tokensForNative = totalAllocatedAmount.div(new BN(3));
            tokensForLP = totalAllocatedAmount.sub(tokensForNative);
            (await zignaly.totalAllocatedAmount()).should.be.bignumber.equal(totalAllocatedAmount);
            (await zignaly.tokensForNative()).should.be.bignumber.equal(tokensForNative);
            (await zignaly.tokensForLP()).should.be.bignumber.equal(tokensForLP);
        });

        it('shouldn\'t withdraw rewards before start date', async () => {
            startDateNew = startDate + vestingDuration;
            rewardToken = await MockErc20.new(ether("3000"), { from: owner });
            zignaly = await Zignaly.new(identity.address, rewardToken.address, startDateNew, ether("3000"));
            Z = zignaly.address;
            await rewardToken.transfer(Z, ether("3000"));
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                zignaly.withdrawReward(
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
            await timeMachine.advanceTime(aMonth * 1.5);
            result = await zignaly.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.most(ether("150"));
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.at.least(ether("149.9999"));
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
            await timeMachine.advanceTime(aMonth * 2);
            result = await zignaly.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") })
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
                zignaly.withdrawReward(
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
            result = await zignaly.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") });

            await expectRevert(
                zignaly.withdrawReward(
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
            await zignaly.changeSignerList(newSigner.address, true);
            let message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary1 },
                { type: "uint256", value: percentageLp },
                { type: "uint256", value: percentageNative },
                { type: "uint256", value: "0" },
            ]);
            let signature = EthCrypto.sign(newSigner.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            result = await zignaly.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") });
        });

        it('shouldn\'t add signer with zero address', async () => {
            await expectRevert(
                zignaly.changeSignerList(constants.ZERO_ADDRESS, true),
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
                zignaly.withdrawReward(
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
            result = await zignaly.withdrawReward(
                percentageLp,
                percentageNative,
                vrs.v,
                vrs.r,
                vrs.s,
                { from: beneficiary1 }
            );
            (await rewardToken.balanceOf(beneficiary1)).should.be.bignumber.equal(ether("300"));
            expectEvent(result, "RewardPaid", { investor: beneficiary1, amount: ether("300") })

            message = EthCrypto.hash.keccak256([
                { type: "address", value: beneficiary2 },
                { type: "uint256", value: highPercentageLP },
                { type: "uint256", value: highPercentageNative },
                { type: "uint256", value: "0" },
            ]);
            signature = EthCrypto.sign(identity.privateKey, message);
            vrs = EthCrypto.vrs.fromString(signature);
            await expectRevert(
                zignaly.withdrawReward(
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
            await erc20.transfer(Z, amount, { from: beneficiary1 });
            await zignaly.withdrawERC20(erc20.address, amount);
            (await erc20.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
        });

        it('shouldn\'t withdraw tokens if insufficient tokens balance in contract', async () => {
            amount = ether("1000");
            erc20 = await MockErc20.new(ether("3000"), { from: beneficiary1 });
            await erc20.transfer(Z, amount, { from: beneficiary1 });
            await expectRevert(
                zignaly.withdrawERC20(erc20.address, ether("3000")),
                "Insufficient tokens balance"
            );
        });
    })
})