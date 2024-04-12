pragma solidity ^0.8.24;

import "./Concert.sol";

contract Ticket {
    
    Concert concertContract;
    
    struct Ticket {
        uint256 ticketId;
        uint256 concertId;
        address prevTicketOwner;
        uint24 category;
        uint256 cost; 
        string passportId; 
    }

    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => address) public ticketOwners;

    event TicketCreated(
        uint256 indexed ticketId, 
        uint256 indexed concertId, 
        address owner,
        uint24 category, 
        uint256 cost, 
        string passportId); // consider using hashes of passportIds instead for privacy

    constructor(address _concertAddress) {
        concertContract = Concert(_concertAddress);
    }

    function createTicket(
        uint256 ticketId, 
        uint256 concertId, 
        address prevTicketOwner,
        uint24 category, 
        uint256 cost, 
        string memory passportId) public { 
        require(concertContract.isValidConcert(concertId), "Concert is invalid");
        //require(concertContract.getOwner() == msg.sender, "Only the concert owner can create tickets");

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            concertId: concertId, 
            prevTicketOwner: address(0), // initially, there's no previous owner
            category: category,
            cost: cost,
            passportId: passportId // assignment unique passportId of current holder
        });

        ticketOwners[ticketId] = msg.sender; // Marking the ticket's creator as its initial owner (buyer)

        emit TicketCreated(ticketId, concertId, msg.sender, category, cost, passportId);
    }

    function getOwner(uint256 ticketId) public view returns (address) {
        require(tickets[ticketId].ticketId != 0, "Ticket does not exist");
        return ticketOwners[ticketId];
    }

    function validateTicket(uint256 ticketId, string memory passportId) public view returns (bool) {
        // check if ticket exists and validate ownership using passportId 
        return tickets[ticketId].ticketId == ticketId && 
        keccak256(abi.encodePacked(tickets[ticketId].passportId)) == keccak256(abi.encodePacked(passportId));
    }

    function getConcertIdFromTicketId(uint256 ticketId, string memory passportId) public view returns (uint256) {
        require(validateTicket(ticketId, passportId), "Ticket is invalid");
        return tickets[ticketId].concertId;
    }

    function getPreviousTicketOwner(uint256 ticketId, string memory passportId) public view returns (address) {
        require(validateTicket(ticketId, passportId), "Ticket is invalid");
        return tickets[ticketId].prevTicketOwner;
    }

    function isValidTicket(uint256 ticketId) public view returns (bool) {
        return ticketOwners[ticketId] != address(0);
    }

    function getTicketCost(uint256 ticketId) public view returns (uint256) { 
        require(isValidTicket(ticketId), "Ticket is invalid");
        return tickets[ticketId].cost;
    }

    // View function 
// Solidity contract snippet
    function getTicketDetails(uint256 ticketId) public view returns (uint256, uint256, uint256, uint24) {
        require(tickets[ticketId].ticketId != 0, "Ticket does not exist");
        Ticket storage ticket = tickets[ticketId];
        return (ticket.ticketId, ticket.concertId, ticket.cost, ticket.category);
    }
}
