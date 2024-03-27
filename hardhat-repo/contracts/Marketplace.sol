pragma solidity ^0.8.24;

import "./Concert.sol";
import "./Ticket.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Marketplace is ERC721 {

    address owner; // Concert Organizer
    uint256 ticketId; // tokenId of NFT
    Concert concertContract;
    //Ticket ticketContract;
    address[] queue;

    mapping(uint256 => mapping(address => bool)) hasQueued;
    mapping(uint256 => mapping(uint256 => address)) seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;

    constructor(Concert concertAddress, string memory _name, string memory _symbol) ERC721(_name, _symbol) public {
        concertContract = concertAddress;
        owner = msg.sender;
    }

    // constructor(Concert concertAddress, Ticket ticketAddress, string memory _name,
    //     string memory _symbol) ERC721(_name, _symbol) public {
    //     concertContract = concertAddress;
    //     ticketContract = ticketAddress;
    //     owner = msg.sender;
    // }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier validConcert(uint256 concertId) {
        require(concertContract.isValidConcert(concertId), "Invalid concert id");
        _;
    }

    
    modifier primaryMarketplaceOpen(uint256 concertId) {
        require(concertContract.getConcertStage(concertId) == Concert.Stage.PRIMARY_SALE, "Not at primary sale stage");
        _;
    }


    function joinQueue(uint256 concertId) public validConcert(concertId) primaryMarketplaceOpen(concertId) {
        // Buyer has not queued
        require(!hasQueued[concertId][msg.sender], "You are already in the queue");
        queue.push(msg.sender);
        hasQueued[concertId][msg.sender] = true;
    }

    function buyTicket(uint256 concertId, uint24[] memory seatNumbers, 
        string[] memory passportIds) public payable validConcert(concertId) primaryMarketplaceOpen(concertId) {
        // Buyer is at the front of the queue
        require(msg.sender == queue[0]);

        uint256 amtToPay = 0;
        
        for (uint i = 0; i < seatNumbers.length; i++) {
            // Valid seat ids
            require(seatNumbers[i] > 0);
            require(concertContract.isValidSeat(concertId, seatNumbers[i]));
            // Seat is not taken
            require(seatTaken[concertId][seatNumbers[i]] == address(0));

            amtToPay += concertContract.getSeatCost(concertId, seatNumbers[i]);
        }

        // Eth sent is enough
        require(msg.value >= amtToPay);

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

    //getting the owner
    function getOwner() public view returns (address) {
        return owner;
    }

    function getHasQueued(uint256 concertId) public view returns (bool) {
        return hasQueued[concertId][msg.sender];
    }

}