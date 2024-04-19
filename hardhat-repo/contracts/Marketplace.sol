pragma solidity ^0.8.24;

import "./Concert.sol";
import "./Ticket.sol";

import "hardhat/console.sol";

contract Marketplace {

    address owner; // Concert Organizer
    uint256 ticketId; // tokenId of NFT
    Concert concertContract;
    Ticket ticketContract;
    //address[] queue;

    mapping(uint256 => mapping(address => bool)) hasQueued;
    mapping(uint256 => mapping(uint256 => address)) seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;
    mapping(uint256 => address[]) concertQueues;

    constructor(Concert concertAddress, Ticket ticketAddress) public {
        concertContract = concertAddress;
        ticketContract = ticketAddress;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier validConcert(uint256 concertId) {
        require(concertContract.isValidConcert(concertId), "Invalid concert id");
        _;
    }

    
    modifier primaryMarketplaceOpen(uint256 concertId) {
        require(concertContract.getConcertStage(concertId) == Concert.Stage.PRIMARY_SALE 
        || concertContract.getConcertStage(concertId) == Concert.Stage.SECONDARY_SALE, "Primary marketplace is closed");
        _;
    }


    function joinQueue(uint256 concertId) public validConcert(concertId) primaryMarketplaceOpen(concertId) {
        // Buyer has not queued
        require(!hasQueued[concertId][msg.sender], "You are already in the queue");
        concertQueues[concertId].push(msg.sender);
        hasQueued[concertId][msg.sender] = true;
    }

    function buyTicket(uint256 concertId, uint24[] memory seatNumbers, 
        string[] memory passportIds) public payable validConcert(concertId) primaryMarketplaceOpen(concertId) {
        // Buyer is at the front of the queue
        require(msg.sender == concertQueues[concertId][0], "Buyer not at the front of the queue");
        // Valid concert id
        require(concertId > 0, "Invalid concertId");
        require(concertContract.isValidConcert(concertId), "Invalid concertId (2)"); // use isValidConcert method

        uint256 amtToPay = 0;
        
        for (uint i = 0; i < seatNumbers.length; i++) {
            // Valid seat ids
            require(seatNumbers[i] > 0, "Seat numbers must be greater than 0");
            require(concertContract.isValidSeat(concertId, seatNumbers[i]), "Invalid seat ID");
            // Seat is not taken
            require(seatTaken[concertId][seatNumbers[i]] == address(0), "Seat is taken");

            // Pull category and cost for the seat
            uint24 category = concertContract.getSeatCategory(concertId, seatNumbers[i]);
            uint256 cost = concertContract.getSeatCost(concertId, seatNumbers[i]);

            amtToPay += cost;
        }

        console.log("Amount: %s", amtToPay);

        // Eth sent is enough
        require(msg.value >= amtToPay, "Insufficient eth sent");

        for (uint i = 0; i < seatNumbers.length; i++) {
            // Update seat status
            seatTaken[concertId][seatNumbers[i]] = msg.sender;
            seatsTaken[concertId].push(seatNumbers[i]);
            // Mint NFT
            ticketId++;
            // Create ticket object
            uint24 category = concertContract.getSeatCategory(concertId, seatNumbers[i]);
            uint256 cost = concertContract.getSeatCost(concertId, seatNumbers[i]);
            string memory passportId = passportIds[i];
            ticketContract.createTicket(ticketId, concertId, msg.sender, category, cost, passportId, false); 
        }

        /// Pop buyer from queue
        address[] memory queue = concertQueues[concertId];
        address[] memory newQueue = new address[](queue.length - 1); // Initialize newQueue with appropriate size
        for (uint i = 1; i < queue.length; i++) {
            newQueue[i - 1] = queue[i]; // Assign queue elements to newQueue
        }
        concertQueues[concertId] = newQueue;

    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }

    //getting the owner
    function getOwner() public view returns (address) {
        return owner;
    }

    function getHasQueued(uint256 concertId) public view returns (bool) {
        return hasQueued[concertId][msg.sender];
    }

    function getSeatAddress(uint256 concertId, uint256 seatId) public view returns (address) {
        return seatTaken[concertId][seatId];
    }

    function getQueuePosition(uint256 concertId) public view returns (uint256) {
        address[] memory queue = concertQueues[concertId];

        for (uint i = 0; i < queue.length; i++) {
            if (queue[i] == msg.sender) {
                return i + 1;
            }
        }

        return 0;
    }

}