pragma solidity ^0.8.24;

import "./Concert.sol";
import "./Ticket.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Marketplace is ERC721 {

    address owner; // Concert Organizer
    uint256 ticketId; // tokenId of NFT
    Concert concertContract;
    Ticket ticketContract;
    address[] queue;

    mapping(uint256 => mapping(address => bool)) hasQueued;
    mapping(uint256 => mapping(uint256 => address)) seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;

    constructor(Concert concertAddress, Ticket ticketAddress, string memory _name,
        string memory _symbol) ERC721(_name, _symbol) public {
        concertContract = concertAddress;
        ticketContract = ticketAddress;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // can be added to below functions
    modifier primaryMarketplaceOpen(uint256 concertId) {
        require(concertContract.getConcertStage(concertId) == Concert.Stage.PRIMARY_SALE, "Marketplace not open");
        _;
    }

    function joinQueue(uint256 concertId) public primaryMarketplaceOpen(concertId) {
        // Buyer has not queued
        require(!hasQueued[concertId][msg.sender]);
        queue.push(msg.sender);
        hasQueued[concertId][msg.sender] = true;
    }

    function buyTicket(uint256 concertId, uint24[] memory seatNumbers, string[] memory passportIds) public payable primaryMarketplaceOpen(concertId) {
        // Buyer is at the front of the queue
        require(msg.sender == queue[0], "Buyer not at front of queue");
        // Valid concert id
        require(concertId > 0, "Invalid concertId");
        require(concertContract.isValidConcert(concertId), "Invalid concertId (2)"); // use isValidConcert method

        uint256 amtToPay = 0;
        
        for (uint i = 0; i < seatNumbers.length; i++) {
            // Valid seat ids
            require(seatNumbers[i] > 0, "Seat numbers must be greater than 0");
            require(concertContract.isValidSeat(concertId, seatNumbers[i]), "Seat numbers are invalid");
            // Seat is not taken
            require(seatTaken[concertId][seatNumbers[i]] == address(0), "Seat must be empty");

            amtToPay += concertContract.getSeatCost(concertId, seatNumbers[i]);
        }

        // Eth sent is enough
        require(msg.value >= amtToPay, "Not enough amount sent");

        for (uint i = 0; i < seatNumbers.length; i++) {
            // Update seat status
            seatTaken[concertId][seatNumbers[i]] = msg.sender;
            seatsTaken[concertId].push(seatNumbers[i]);
            // Mint NFT
            ticketId++;
            _safeMint(msg.sender, ticketId);
            // Create ticket object
            string memory passport = passportIds[i];
            //ticketContract.createTicket(); // check what to pass in
            ticketContract.updateTicketOwner(ticketId, msg.sender);
        }

        /// Pop buyer from queue
        address[] memory newQueue = new address[](queue.length - 1); // Initialize newQueue with appropriate size
        for (uint i = 1; i < queue.length; i++) {
            newQueue[i - 1] = queue[i]; // Assign queue elements to newQueue
        }
        queue = newQueue;

    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }

}