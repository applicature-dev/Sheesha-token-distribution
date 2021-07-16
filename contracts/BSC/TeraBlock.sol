// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../BaseContracts/AdvanceVesting.sol";

contract TeraBlock is AdvanceVesting {
    constructor(
        address signer_,
        address token_,
        uint256 startDate_,
        uint256 cliffDuration_,
        uint256 vestingDuration_,
        uint256 tgePercentage_,
        uint256 totalAllocatedAmount_
    )
        AdvanceVesting(
            signer_,
            token_,
            startDate_,
            cliffDuration_,
            vestingDuration_,
            tgePercentage_,
            totalAllocatedAmount_
        )
    {}
}
