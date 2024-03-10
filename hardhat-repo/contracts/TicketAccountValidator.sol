// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketAccountValidator is Ownable {
    // Mapping to keep track of validated accounts
    mapping(address => bool) private validatedTicketAccounts;

    // Event to emit when an account is validated
    event TicketAccountValidated(address indexed account);
    // Event to emit when an account's validation is revoked
    event TicketAccountValidationRevoked(address indexed account);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Function to validate an account
    function validateTicketAccount(address account) public onlyOwner {
        require(!validatedTicketAccounts[account], "TicketAccount is already validated.");
        validatedTicketAccounts[account] = true;
        emit TicketAccountValidated(account);
    }

    // Function to revoke validation of an account
    function revokeValidation(address account) public onlyOwner {
        require(validatedTicketAccounts[account], "TicketAccount is not validated.");
        validatedTicketAccounts[account] = false;
        emit TicketAccountValidationRevoked(account);
    }

    // Function to check if an account is validated
    function isTicketAccountValidated(address account) public view returns (bool) {
        return validatedTicketAccounts[account];
    }
}

// Example usage
// Assuming you have an instance of TicketAccountValidation contract
// TicketAccountValidation private accountValidator;

// function buyTicket(uint256 eventId) public {
//     require(accountValidator.isTicketAccountValidated(msg.sender), "Your account is not validated for transactions.");
//     // Proceed with ticket purchase logic
// }