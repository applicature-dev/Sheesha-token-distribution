// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/utils/Counters.sol";

contract Signer {
    using Counters for Counters.Counter;
    mapping(address => Counters.Counter) public nonces;
    mapping(address => bool) public trustedSigner;

    constructor(address signer_) {
        require(signer_ != address(0), "Invalid signer address");
        trustedSigner[signer_] = true;
    }

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

    function changePermission(address signer, bool permission) internal {
        require(signer != address(0), "Invalid signer address");
        trustedSigner[signer] = permission;
    }
}
