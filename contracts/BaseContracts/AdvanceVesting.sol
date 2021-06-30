// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "./BaseVesting.sol";

contract AdvanceVesting is BaseVesting  {
    using SafeMath for uint256;

    uint256 public firstRelease;
    uint256 public cliffDuration;
    uint256 public tgePercentage;
    uint256 public remainingPercentage;

    constructor(address signer_) BaseVesting(signer_) {}

    function _calculateAvailablePercentage() internal view override returns (uint256) {
        uint256 currentTimeStamp = block.timestamp;
        if (currentTimeStamp < startDate) {
            return 0;
        } else if (
            currentTimeStamp >= startDate && currentTimeStamp < firstRelease
        ) {
            return tgePercentage;
        } else if (
            currentTimeStamp >= firstRelease &&
            currentTimeStamp < vestingTimeEnd
        ) {
            uint256 noOfDays = currentTimeStamp.sub(firstRelease).div(PERIOD);
            uint256 currentUnlockedPercentage = noOfDays.mul(
                everyDayReleasePercentage
            );
            return tgePercentage.add(currentUnlockedPercentage);
        } else {
            return PERCENTAGE;
        }
    }
}
