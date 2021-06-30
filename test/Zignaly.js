const {
    constants,
    expectRevert,
    ether
} = require("@openzeppelin/test-helpers");

const BN = require("bn.js");

require("chai")
    .use(require("chai-as-promised"))
    .use(require("chai-bn")(BN))
    .should();

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

    before(async function () {
        rewardToken = await MockErc20.new(ether("3000"), { from: owner });
        zignaly = await Zignaly.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("3000"));
        Z = zignaly.address;
        await rewardToken.transfer(Z, ether("3000"));
    });

    describe("Zignaly Distribution Initializing Phase Test Cases", function () {
        it("should initialize vesting with correct start date", async () => {
            (await zignaly.startDate()).should.be.bignumber.equal(startDate.toString());
        });

        it("should initialize vesting with correct duration", async () => {
            (await zignaly.vestingDuration()).should.be.bignumber.equal(vestingDuration.toString());
        });

        it("should initialize vesting with correct total time", async () => {
            (await zignaly.vestingTimeEnd()).should.be.bignumber.equal(vestingTime.toString());
        });

        it("should initialize vesting with correct monthly percentage", async () => {
            (await zignaly.everyDayReleasePercentage()).should.be.bignumber.equal(everyDayReleasePercentage.toString());
        });

        it("shouldn\'t initialize vesting with empty signer address", async () => {
            await expectRevert(
                Zignaly.new(constants.ZERO_ADDRESS, rewardToken.address, startDate, vestingDuration, ether("3000")),
                "Invalid signer address"
            );
        });

        it("shouldn\'t initialize vesting with empty reward token address", async () => {
            await expectRevert(
                Zignaly.new(identity.address, constants.ZERO_ADDRESS, startDate, vestingDuration, ether("3000")),
                "Invalid reward token address"
            );
        });

        it("shouldn\'t initialize vesting with empty tge timestamp", async () => {
            await expectRevert(
                Zignaly.new(identity.address, rewardToken.address, 0, vestingDuration, ether("3000")),
                "TGE timestamp can't be 0"
            );
        });

        it("shouldn\'t initialize vesting with empty vesting duration", async () => {
            await expectRevert(
                Zignaly.new(identity.address, rewardToken.address, startDate, 0, ether("3000")),
                "The vesting duration cannot be 0"
            );
        });

        it("shouldn\'t initialize vesting with zero token rewards", async () => {
            await expectRevert(
                Zignaly.new(identity.address, rewardToken.address, startDate, vestingDuration, ether("0")),
                "The number of tokens for distribution cannot be 0"
            );
        });
    });
})