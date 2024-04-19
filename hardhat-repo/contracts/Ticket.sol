pragma solidity ^0.8.24;

import "./Concert.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Ticket is ERC721 {
    
    Concert concertContract;
    uint256 numOfTickets;
    address owner;
    
    struct Ticket {
        uint256 ticketId;
        uint256 concertId;
        uint24 category;
        uint256 cost; 
        string passportId; 
        bool validatedForUse;
        uint24 seatNumber;
        string concertName;
        string concertLocation;
        uint concertDate;
    }

    mapping(uint256 => Ticket) public tickets; // using 1-based indexing

    event TicketCreated(
        uint256 indexed ticketId, 
        uint256 indexed concertId, 
        address owner,
        uint24 category, 
        uint256 cost, 
        string passportId,
        bool validatedForUse,
        uint24 seatNumber
    ); // consider using hashes of passportIds instead for privacy

    // event to track when a ticket is used for entry into a concert
    event TicketUsed(
        uint256 indexed ticketId, 
        uint256 concertId, 
        address attendee
    );

    constructor(address concertAddress, string memory _name, string memory _symbol) ERC721(_name, _symbol) public {
        concertContract = Concert(concertAddress);
        owner = msg.sender;
    }

    function createTicket(
        uint256 ticketId, 
        uint256 concertId,
        address buyer, 
        uint24 category, 
        uint256 cost, 
        string memory passportId,
        bool validatedForUse,
        uint24 seatNumber
        ) public { 
        require(concertContract.isValidConcert(concertId), "Concert is invalid");
        Concert.Concert memory concert = concertContract.getConcertDetailsFromConcertId(concertId);

        numOfTickets = ticketId;

        tickets[ticketId] = Ticket({
            ticketId: ticketId,
            concertId: concertId, 
            category: category,
            cost: cost,
            passportId: passportId, // assignment unique passportId of current holder
            validatedForUse: false,
            seatNumber: seatNumber,
            concertName: concert.name,
            concertLocation: concert.location,
            concertDate: concert.concertDate
        });

        _safeMint(buyer, ticketId);

        emit TicketCreated(ticketId, concertId, buyer, category, cost, passportId, false, seatNumber);
    }

    modifier onlyContractOwner() {
        require(msg.sender == owner, "Caller is not the owner of the contract"); 
        _; 
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

    function stampTicketForConcert(uint256 concertId, uint256 ticketId, string memory passportId) 
        public 
        onlyContractOwner()
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

    function getAllTicketsForOpenConcerts() public view onlyContractOwner returns (Ticket[] memory) {
        Concert.Concert[] memory openConcerts = concertContract.getConcertsByStage(3);
        uint256 count = 0;
        for (uint256 i = 1; i <= numOfTickets; i++) {
            for (uint256 j = 0; j < openConcerts.length; j++) {
                if (tickets[i].concertId == openConcerts[j].id) {
                    count++;
                }
            }
        }
        Ticket[] memory openTickets = new Ticket[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= numOfTickets; i++) {
            for (uint256 j = 0; j < openConcerts.length; j++) {
                if (tickets[i].concertId == openConcerts[j].id) {
                    openTickets[index] = tickets[i];
                    index++;
                    if (index == count) return openTickets; // early terminate once all tickets intended found
                }
            }
        }
        return openTickets;
    }
}
