// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract ArtVerifier is FunctionsClient, ConfirmedOwner {
    string public authenticityResult;
    bytes32 public lastRequestId;

    // DON ID for Sepolia testnet
        bytes32 public constant DON_ID = bytes32(uint256(0x66756e6374696f6e73));

    constructor(address router) FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    // Accepts pre-encoded CBOR request from off-chain
    function requestVerification(
        bytes memory encodedRequest,
        uint64 subscriptionId,
        uint32 gasLimit
    ) public onlyOwner {
        lastRequestId = _sendRequest(encodedRequest, subscriptionId, gasLimit, DON_ID);
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory /*err*/
    ) internal override {
        require(requestId == lastRequestId, "Mismatched request");
        authenticityResult = string(response);
    }
}
