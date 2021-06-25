// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Signer.sol";

contract RaiinMaker is Ownable, Signer {
    using SafeMath for uint256;

    struct Investor {
        uint256 paidAmount;
        uint256 timeRewardPaid;
    }

    uint256 public constant PERIOD = 1 days;
    uint256 public constant CLIFF_DURATION = 360 days;
    uint256 public constant VESTING_DURATION = 360 days;
    uint256 public constant TGE_Percentage = 15e18;
    uint256 public constant REMAINING_PERCENTAGE = 85e18;
    uint256 public constant PERIODS = 360;
    uint256 public constant PERCENTAGE = 1e20;

    IERC20 public token;
    uint256 public firstRelease;
    uint256 public everyDayReleasePercentage;
    uint256 public vestingTimeEnd;
    uint256 public startDate;
    uint256 public totalAllocatedAmount;
    uint256 public tokensForLP;
    uint256 public tokensForNative;

    event RewardPaid(address indexed investor, uint256 amount);

    mapping(address => Investor) public investorInfo;

    constructor(
        address signer_,
        address token_,
        uint256 startDate_,
        uint256 totalAllocatedAmount_
    ) Signer(signer_) {
        require(token_ != address(0), "Invalid reward token address");
        require(startDate_ != 0, "TGE timestamp can't be 0");
        require(
            totalAllocatedAmount_ != 0,
            "The number of tokens for distribution cannot be 0"
        );
        token = IERC20(token_);
        startDate = startDate_;
        firstRelease = startDate.add(CLIFF_DURATION);
        vestingTimeEnd = startDate.add(CLIFF_DURATION).add(VESTING_DURATION);
        everyDayReleasePercentage = REMAINING_PERCENTAGE.div(PERIODS);
        totalAllocatedAmount = totalAllocatedAmount_;
        tokensForNative = totalAllocatedAmount_.div(3);
        tokensForLP = totalAllocatedAmount_.sub(tokensForNative);
    }

    /**
     * @dev Withdraw reward tokens from distribution contract by investor
     */

    function withdrawReward(
        uint256 portionLP,
        uint256 portionNative,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(
            portionLP <= PERCENTAGE && portionNative <= PERCENTAGE,
            "The percentage cannot be greater than 100"
        );
        bool access = isValidData(
            msg.sender,
            portionLP,
            portionNative,
            v,
            r,
            s
        );
        require(access, "Permission not granted");
        _withdrawReward(msg.sender, portionLP, portionNative);
    }

    function changeSignerList(address signer, bool permission)
        public
        onlyOwner
    {
        changePermission(signer, permission);
    }

    /**
     * @notice withdraw any erc20 send accidentally to the contract
     * @param tokenAddress_ token address
     * @param amount amount to withdraw
     */
    function withdrawERC20(address tokenAddress_, uint256 amount) external onlyOwner {
        IERC20 tokenAddress = IERC20(tokenAddress_);
        require(
            tokenAddress.balanceOf(address(this)) >= amount,
            "Insufficient tokens balance"
        );
        tokenAddress.transfer(msg.sender, amount);
    }

    function _withdrawReward(
        address beneficiary,
        uint256 percenageLP,
        uint256 percentageNative
    ) private {
        uint256 reward = _getRewardBalance(percenageLP, percentageNative);
        Investor storage investor = investorInfo[beneficiary];
        uint256 balance = token.balanceOf(address(this));
        require(reward > investor.paidAmount, "No rewards available");
        uint256 amountToPay = reward.sub(investor.paidAmount);
        require(amountToPay <= balance, "The rewards are over");
        investor.paidAmount = reward;
        investor.timeRewardPaid = block.timestamp;
        token.transfer(beneficiary, amountToPay);
        emit RewardPaid(beneficiary, amountToPay);
    }

    function _getRewardBalance(uint256 lpPercentage, uint256 nativePercentage)
        private
        view
        returns (uint256)
    {
        uint256 vestingAvailablePercentage = _calculateAvailableAmount();
        uint256 amountAvailableForLP = tokensForLP
        .mul(vestingAvailablePercentage)
        .div(PERCENTAGE);
        uint256 amountAvailableForNative = tokensForNative
        .mul(vestingAvailablePercentage)
        .div(PERCENTAGE);
        uint256 rewardToPayLP = amountAvailableForLP
        .mul(lpPercentage)
        .div(PERCENTAGE);
        uint256 rewardToPayNative = amountAvailableForNative
        .mul(nativePercentage)
        .div(PERCENTAGE);
        return rewardToPayLP.add(rewardToPayNative);
    }

    function _calculateAvailableAmount() private view returns (uint256) {
        uint256 currentTimeStamp = block.timestamp;
        if (currentTimeStamp < startDate) {
            return 0;
        } else if (
            currentTimeStamp >= startDate && currentTimeStamp < firstRelease
        ) {
            return TGE_Percentage;
        } else if (
            currentTimeStamp >= firstRelease && currentTimeStamp < vestingTimeEnd
        ) {
            uint256 noOfDays = currentTimeStamp.sub(firstRelease).div(PERIOD);
            uint256 currentUnlockedPercentage = noOfDays.mul(
                everyDayReleasePercentage
            );
            return TGE_Percentage.add(currentUnlockedPercentage);
        } else {
            return uint256(100).mul(1e18);
        }
    }
}
