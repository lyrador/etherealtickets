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
        bool validatedForUse;
    }

    mapping(uint256 => Ticket) public tickets;

    event TicketCreated(
        uint256 indexed ticketId, 
        uint256 indexed concertId, 
        address owner,
        uint24 category, 
        uint256 cost, 
        string passportId,
        bool validatedForUse
    ); // consider using hashes of passportIds instead for privacy
    
    // event to track ownership changes of tickets
    event TicketOwnerUpdated(
        uint256 indexed ticketId, 
        address indexed oldOwner,
        address indexed newOwner, 
        uint256 concertId, 
        uint256 timestamp
    );

    // event to track when a ticket is used for entry into a concert
    event TicketUsed(
        uint256 indexed ticketId, 
        uint256 concertId, 
        address attendee
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
        string memory passportId,
        bool validatedForUse
        ) public { 
        require(concertContract.isValidConcert(concertId), "Concert is invalid");

        numOfTickets = ticketId;

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            concertId: concertId, 
            prevTicketOwner: address(0), // initially, there's no previous owner
            category: category,
            cost: cost,
            passportId: passportId, // assignment unique passportId of current holder
            validatedForUse: false
        });

        _safeMint(buyer, ticketId);

        emit TicketCreated(ticketId, concertId, buyer, category, cost, passportId, false);
    }

    modifier onlyTicketOwner(uint256 ticketId) {
        require(msg.sender == ownerOf(ticketId), "Caller is not the ticket owner"); 
        _; 
    }

    modifier validConcert(uint256 concertId) {
        require(concertContract.isValidConcert(concertId), "Invalid concert id");
        _;
    }

    modifier onlyConcertOpen(uint256 concertId) {
        require(concertContract.getConcertStage(concertId) == Concert.Stage.OPEN, "You cannot use ticket for concert as it is not in the correct Stage");
        _;
    }

    function validateTicket(uint256 ticketId, string memory passportId) public view returns (bool) {
        // check if ticket exists and validate ownership using passportId 
        return tickets[ticketId].ticketId == ticketId && 
        keccak256(abi.encodePacked(tickets[ticketId].passportId)) == keccak256(abi.encodePacked(passportId));
    }

    function useTicketForConcert(uint256 concertId, uint256 ticketId, string memory passportId) 
        public 
        onlyTicketOwner(ticketId) 
        validConcert(concertId) 
        onlyConcertOpen(concertId) 
        returns (bool) 
    {
        require(tickets[ticketId].ticketId != 0, "Ticket does not exist");
        // require(concertContract.getOwner() == msg.sender, "Concert Organizer has to approve ticket");
        require(validateTicket(ticketId, passportId), "Ticket is not eligible for concert");
        tickets[ticketId].validatedForUse = true;
        emit TicketUsed(ticketId, concertId, msg.sender);
        return true;
    }

    function getConcertIdFromTicketId(uint256 ticketId) public view returns (uint256) {
        require(isValidTicket(ticketId));
        return tickets[ticketId].concertId;
    }

    function getPreviousTicketOwner(uint256 ticketId, string memory passportId) public view returns (address) {
        require(validateTicket(ticketId, passportId), "Ticket is invalid");
        return tickets[ticketId].prevTicketOwner;
    }

    function isValidTicket(uint256 ticketId) public view returns (bool) {
        return ownerOf(ticketId) != address(0); //revertedWithCustomError "ERC721NonexistentToken" if invalid
    }

    function getTicketCost(uint256 ticketId) public view returns (uint256) { 
        require(isValidTicket(ticketId));
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
    function getOwnedTickets(address owner) public view returns (Ticket[] memory) {

        uint count = 0;
        for (uint i = 1; i <= numOfTickets; i++) {
            if (ownerOf(i) == owner) {
                count++;
            }
        }

        Ticket[] memory ownedTickets = new Ticket[](count);
        uint index = 0;
        for (uint i = 1; i <= numOfTickets; i++) {
            if (ownerOf(i) == owner) {
                ownedTickets[index] = tickets[i];
                index++;
            }
        }

        return ownedTickets;

    }

    // Upon secondaryMarket buy ticket, update passportId
    // TO RMB: find a way to fix accessRight to only secondaryMarketplaceAddress can call, think can put secondaryMarketplace address in ticket struct
    function updateTicketPassportId(uint256 ticketId, string memory passportId) public {
        require(isValidTicket(ticketId));
        tickets[ticketId].passportId = passportId;
    }
}
