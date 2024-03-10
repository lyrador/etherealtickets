// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EtherConsumer {
    // Event to emit the amount of Ether received
    event EtherReceived(address sender, uint amount);

    // Function to receive Ether
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    // Function to check the contract's balance
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}