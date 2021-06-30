// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../BaseContracts/BaseVesting.sol";

contract PlasmaFinance is BaseVesting {
    using SafeMath for uint256;

    constructor(
        address signer_,
        address token_,
        uint256 startDate_,
        uint256 vestingDuration_,
        uint256 totalAllocatedAmount_
    ) BaseVesting(signer_) {
        require(token_ != address(0), "Invalid reward token address");
        require(startDate_ != 0, "TGE timestamp can't be 0");
        require(
            vestingDuration_ > 0,
            "The vesting duration cannot be 0"
        );
        require(
            totalAllocatedAmount_ != 0,
            "The number of tokens for distribution cannot be 0"
        );
        token = IERC20(token_);
        startDate = startDate_;
        vestingDuration = vestingDuration_;
        vestingTimeEnd = startDate.add(vestingDuration_);
        periods = vestingDuration_.div(PERIOD);
        everyDayReleasePercentage = PERCENTAGE.div(periods);
        totalAllocatedAmount = totalAllocatedAmount_;
        tokensForNative = totalAllocatedAmount_.div(3);
        tokensForLP = totalAllocatedAmount_.sub(tokensForNative);
    }
}
