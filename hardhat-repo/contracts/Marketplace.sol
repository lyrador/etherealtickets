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

    constructor(Concert concertAddress, Ticket ticketAddress) public {
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
        require(concertContract.getConcertStage(concertId) == Concert.Stage.PRIMARY_SALE);
        _;
    }

    function joinQueue(uint256 concertId) public primaryMarketplaceOpen(concertId) {
        // Buyer has not queued
        require(!hasQueued[concertId][msg.sender]);
        queue.push(msg.sender);
        hasQueued[concertId][msg.sender] = true;
    }

    function buyTicket(uint256 concertId, uint256[] memory seatIds, string[] memory passportIds) public payable primaryMarketplaceOpen(concertId) {
        // Buyer is at the front of the queue
        require(msg.sender == queue[0]);
        // Valid concert id
        require(concertId > 0);
        require(concertContract.isValidConcert(concertId)); // use isValidConcert method

        uint256 amtToPay = 0;
        
        for (uint i = 0; i < seatIds.length; i++) {
            // Valid seat ids
            require(seatIds[i] > 0);
            require(concertContract.isValidSeat(seatIds[i]));
            // Seat is not taken
            require(seatTaken[concertId][seatIds[i]] == address(0));

            amtToPay += concertContract.getSeatCost(seatIds[i]);
        }

        // Eth sent is enough
        require(msg.value >= amtToPay);

        for (uint i = 0; i < seatIds.length; i++) {
            // Update seat status
            seatTaken[concertId][seatIds[i]] = msg.sender;
            seatsTaken[concertId].push(seatIds[i]);
            // Mint NFT
            ticketId++;
            _safeMint(msg.sender, ticketId);
            // Create ticket object
            string memory passport = passportIds[i];
            //ticketContract.createTicket(); // check what to pass in
        }

        // Pop buyer from queue
        address[] memory newQueue;
        for (uint i = 1; i < queue.length; i++) {
            newQueue.push(queue[i]);
        }
        queue = newQueue;

    }

    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }

}