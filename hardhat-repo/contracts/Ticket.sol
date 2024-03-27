pragma solidity ^0.8.24;

contract Ticket {
    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address prevTicketOwner;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => address) public ticketOwner;

    // reference Concert contract
    address public concertAddress;

    event TicketCreated(uint256 indexed ticketId, uint256 indexed eventId, address owner);

    constructor(address _concertAddress) {
        concertAddress = _concertAddress;
    }

    function validateTicket(uint256 ticketId) public view returns (bool) {
        return tickets[ticketId].ticketId == ticketId;
    }

    function getConcertIdFromTicketId(uint256 ticketId) public view returns (uint256) {
        // IMPORTANT: NEED TO UPDATE VALIDATION IN MARKETPLACE FIRST, ELSE WILL HAVE ERRORS, TEMPORARILY COMMENTED OUT
        //require(validateTicket(ticketId), "Ticket is invalid");
        return tickets[ticketId].eventId;
    }

    function getPreviousTicketOwner(uint256 ticketId) public view returns (address) {
        // IMPORTANT: NEED TO UPDATE VALIDATION IN MARKETPLACE FIRST, ELSE WILL HAVE ERRORS, TEMPORARILY COMMENTED OUT
        //require(validateTicket(ticketId), "Ticket is invalid");
        return tickets[ticketId].prevTicketOwner;
    }

    // IMPORTANT: nd to add a check to make sure got access right to update
    function updateTicketOwner(uint256 ticketId, address newOwner) public {
        ticketOwner[ticketId] = newOwner;
    }

    function getTicketOwner(uint256 ticketId) public view returns (address) {
        return ticketOwner[ticketId];
    }

    function isValidTicket(uint256 ticketId) public view returns (bool) {
        return ticketOwner[ticketId] != address(0);
    }
}
