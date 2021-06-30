// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../BaseContracts/AdvanceVesting.sol";

contract RaiinMaker is AdvanceVesting {
    using SafeMath for uint256;

    constructor(
        address signer_,
        address token_,
        uint256 startDate_,
        uint256 cliffDuration_,
        uint256 vestingDuration_,
        uint256 tgePercentage_,
        uint256 totalAllocatedAmount_
    ) AdvanceVesting(signer_) {
        require(token_ != address(0), "Invalid reward token address");
        require(startDate_ != 0, "TGE timestamp can't be 0");
        require(
            vestingDuration_ > 0 && cliffDuration_ > 0,
            "The vesting and cliff duration cannot be 0"
        );
        require(tgePercentage_ > 0, "The tgePercentage cannot be 0");
        require(
            totalAllocatedAmount_ != 0,
            "The number of tokens for distribution cannot be 0"
        );
        token = IERC20(token_);
        startDate = startDate_;
        cliffDuration = cliffDuration_;
        vestingDuration = vestingDuration_;
        firstRelease = startDate.add(cliffDuration_);
        vestingTimeEnd = startDate.add(cliffDuration_).add(vestingDuration_);
        periods = vestingDuration_.div(PERIOD);
        tgePercentage = tgePercentage_;
        remainingPercentage = PERCENTAGE.sub(tgePercentage_);
        everyDayReleasePercentage = remainingPercentage.div(periods);
        totalAllocatedAmount = totalAllocatedAmount_;
        tokensForNative = totalAllocatedAmount_.div(3);
        tokensForLP = totalAllocatedAmount_.sub(tokensForNative);
    }
}
