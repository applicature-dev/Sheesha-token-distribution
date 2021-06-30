// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BaseVesting is Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    struct Investor {
        uint256 paidAmount;
        uint256 timeRewardPaid;
    }

    uint256 public constant PERIOD = 1 days;
    uint256 public constant PERCENTAGE = 1e20;

    IERC20 public token;
    uint256 public everyDayReleasePercentage;
    uint256 public periods;
    uint256 public startDate;
    uint256 public totalAllocatedAmount;
    uint256 public tokensForLP;
    uint256 public tokensForNative;
    uint256 public vestingDuration;
    uint256 public vestingTimeEnd;

    event RewardPaid(address indexed investor, uint256 amount);

    mapping(address => Counters.Counter) public nonces;
    mapping(address => bool) public trustedSigner;
    mapping(address => Investor) public investorInfo;

    constructor(address signer_) {
        require(signer_ != address(0), "Invalid signer address");
        trustedSigner[signer_] = true;
    }

    /**
     * @notice Adds new signer or removes permission from existing
     * @param signer signer address
     * @param permission set permission for signer address
     */
    function changeSignerList(address signer, bool permission)
        public
        onlyOwner
    {
        changePermission(signer, permission);
    }

    /**
     * @dev emergency tokens withdraw
     * @param tokenAddress_ token address
     * @param amount amount to withdraw
     */
    function emergencyTokenWithdraw(address tokenAddress_, uint256 amount)
        external
        onlyOwner
    {
        IERC20 tokenAddress = IERC20(tokenAddress_);
        require(
            tokenAddress.balanceOf(address(this)) >= amount,
            "Insufficient tokens balance"
        );
        tokenAddress.transfer(msg.sender, amount);
    }

    /**
     * @dev data and signature validation
     * @param addr investor address
     * @param portionLP investor portion for LP stake
     * @param portionNative investor portion for Native stake
     * @dev Last three parameters is signature from signer
     */
    function isValidData(
        address addr,
        uint256 portionLP,
        uint256 portionNative,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (bool) {
        bytes32 message = keccak256(
            abi.encodePacked(
                address(this),
                addr,
                portionLP,
                portionNative,
                nonces[addr].current()
            )
        );

        address sender = ecrecover(message, v, r, s);
        if (trustedSigner[sender]) {
            nonces[addr].increment();
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Withdraw reward tokens from distribution contract by investor
     * @param portionLP investor portion for LP stake
     * @param portionNative investor portion for Native stake
     * @dev Last three parameters is signature from signer
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

    /**
     * @dev Returns current available rewards for investor
     * @param percenageLP investor percenage for LP stake
     * @param percentageNative investor percentage for Native stake
     */
    function getRewardBalance(
        address beneficiary,
        uint256 percenageLP,
        uint256 percentageNative
    ) public view returns (uint256 amount) {
        uint256 reward = _getRewardBalance(percenageLP, percentageNative);
        Investor storage investor = investorInfo[beneficiary];
        uint256 balance = token.balanceOf(address(this));
        if (reward <= investor.paidAmount) {
            return 0;
        } else {
            uint256 amountToPay = reward.sub(investor.paidAmount);
            if (amountToPay >= balance) {
                return 0;
            }
            return amountToPay;
        }
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
        uint256 vestingAvailablePercentage = _calculateAvailablePercentage();
        uint256 amountAvailableForLP = tokensForLP
        .mul(vestingAvailablePercentage)
        .div(PERCENTAGE);
        uint256 amountAvailableForNative = tokensForNative
        .mul(vestingAvailablePercentage)
        .div(PERCENTAGE);
        uint256 rewardToPayLP = amountAvailableForLP.mul(lpPercentage).div(
            PERCENTAGE
        );
        uint256 rewardToPayNative = amountAvailableForNative
        .mul(nativePercentage)
        .div(PERCENTAGE);
        return rewardToPayLP.add(rewardToPayNative);
    }

    function _calculateAvailablePercentage()
        internal
        view
        virtual
        returns (uint256)
    {
        uint256 currentTimeStamp = block.timestamp;
        if (currentTimeStamp < startDate) {
            return 0;
        } else if (
            currentTimeStamp >= startDate && currentTimeStamp < vestingTimeEnd
        ) {
            uint256 noOfDays = currentTimeStamp.sub(startDate).div(PERIOD);
            uint256 currentUnlockedPercentage = noOfDays.mul(
                everyDayReleasePercentage
            );
            return currentUnlockedPercentage;
        } else {
            return PERCENTAGE;
        }
    }

    function changePermission(address signer, bool permission) internal {
        require(signer != address(0), "Invalid signer address");
        trustedSigner[signer] = permission;
    }
}
