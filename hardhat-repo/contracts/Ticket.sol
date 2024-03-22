pragma solidity ^0.8.24;

import "./Concert.sol";

contract Ticket {
    
    Concert concertContract;
    
    struct Ticket {
        uint256 ticketId;
        uint256 concertId;
        address prevTicketOwner;
        string category;
        uint256 cost; 
        bool purchased;
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => address) public ticketOwner;

    // reference Concert contract
    address public concertAddress;

    event TicketCreated(uint256 indexed ticketId, uint256 indexed concertId, string category, uint256 cost, address owner);

    constructor(address _concertAddress) {
        concertContract = Concert(_concertAddress);
    }

    function createTicket(uint256 ticketId, uint256 concertId, string category, uint256 cost, string[] _passportIds) public { 
        require(concertContract.isValidConcert(concertId), "Concert is invalid");
        require(concertContract.getOwner() == msg.sender, "Only the concert owner can create tickets");

        // Check uniqueness of ticketId
        require(tickets[ticketId].ticketId == 0, "Ticket already exists");

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            concertId: concertId, 
            prevTicketOwner: address(0), // Initially, there's no previous owner
            category: category,
            cost: cost,
            purchased: false // Initially, the ticket is not purchased
        });

        ticketOwner[ticketId] = msg.sender; // Marking the ticket's creator as its initial owner

        emit TicketCreated(ticketId, concertId, category, cost, msg.sender);
    }


    function validateTicket(uint256 ticketId) public view returns (bool) {
        // think of validating with NRIC of the buyer 
        return tickets[ticketId].ticketId == ticketId;
    }

    function getConcertIdFromTicketId(uint256 ticketId) public view returns (uint256) {
        require(validateTicket(ticketId), "Ticket is invalid");
        return tickets[ticketId].eventId;
    }

    function getPreviousTicketOwner(uint256 ticketId) public view returns (address) {
        require(validateTicket(ticketId), "Ticket is invalid");
        return tickets[ticketId].prevTicketOwner;
    }

    function isValidTicket(uint256 ticketId) public view returns (bool) {
        return ticketOwner[ticketId] != address(0);
    }
}
