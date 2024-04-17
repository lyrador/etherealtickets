pragma solidity ^0.8.24;

import "./Concert.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Ticket is ERC721 {
    
    Concert concertContract;
    uint256 numOfTickets;
    
    struct Ticket {
        uint256 ticketId;
        uint256 concertId;
        address prevTicketOwner;
        uint24 category;
        uint256 cost; 
        string passportId; 
    }

    mapping(uint256 => Ticket) public tickets;

    event TicketCreated(
        uint256 indexed ticketId, 
        uint256 indexed concertId, 
        address owner,
        uint24 category, 
        uint256 cost, 
        string passportId
    ); // consider using hashes of passportIds instead for privacy
    
    // event to track ownership changes of tickets
    event TicketOwnerUpdated(
        uint256 indexed ticketId, 
        address indexed oldOwner,
        address indexed newOwner, 
        uint256 concertId, 
        uint256 timestamp
    );

    constructor(address concertAddress, string memory _name, string memory _symbol) ERC721(_name, _symbol) public {
        concertContract = Concert(concertAddress);
    }

    function createTicket(
        uint256 ticketId, 
        uint256 concertId, 
        address buyer,
        uint24 category, 
        uint256 cost, 
        string memory passportId) public { 
        require(concertContract.isValidConcert(concertId), "Concert is invalid");
        //require(concertContract.getOwner() == msg.sender, "Only the concert owner can create tickets");

        numOfTickets = ticketId;

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            concertId: concertId, 
            prevTicketOwner: address(0), // initially, there's no previous owner
            category: category,
            cost: cost,
            passportId: passportId // assignment unique passportId of current holder
        });

         _safeMint(buyer, ticketId);

        emit TicketCreated(ticketId, concertId, buyer, category, cost, passportId);
    }

    modifier onlyTicketOwner(uint256 ticketId) {
        require(msg.sender == ownerOf(ticketId), "Caller is not the ticket owner"); 
        _; 
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
        return ownerOf(ticketId) != address(0);
    }

    function getTicketCost(uint256 ticketId) public view returns (uint256) { 
        require(isValidTicket(ticketId), "Ticket is invalid");
        return tickets[ticketId].cost;
    }

    // get ticket details by id
    function getTicketDetailsFromTicketId(uint256 ticketId) public view returns (Ticket memory) {
        return tickets[ticketId];
    }
    
    // View ticket
    function getTicketDetails(uint256 ticketId) public view returns (uint256, uint256, uint24, uint256) {
        require(tickets[ticketId].ticketId != 0, "Ticket does not exist");
        Ticket storage ticket = tickets[ticketId];
        return (ticket.ticketId, ticket.concertId, ticket.category, ticket.cost);
    }

    // FOR USE CASE: View Owned Tickets
    function getOwnedTickets() public view returns (Ticket[] memory) {

        uint count = 0;
        for (uint i = 1; i <= numOfTickets; i++) {
            if (ownerOf(i) == msg.sender) {
                count++;
            }
        }

        Ticket[] memory ownedTickets = new Ticket[](count);
        uint index = 0;
        for (uint i = 1; i <= numOfTickets; i++) {
            if (ownerOf(i) == msg.sender) {
                ownedTickets[index] = tickets[i];
                index++;
            }
        }

        return ownedTickets;

    }
}
