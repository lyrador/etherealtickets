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
    modifier primaryMarketplaceOpen(uint256 _concertId) {
        require(concertContract.getConcertStage(_concertId) == Concert.Stage.PRIMARY_SALE);
        _;
    }

    function joinQueue(uint256 _concertId) public primaryMarketplaceOpen(_concertId) {
        // Buyer has not queued
        require(!hasQueued[_concertId][msg.sender]);
        queue.push(msg.sender);
        hasQueued[_concertId][msg.sender] = true;
    }

    function buyTicket(uint256 _concertId, uint256[] _seatIds, string[] _passportIds) public payable primaryMarketplaceOpen(_concertId) {
        // Buyer is at the front of the queue
        require(msg.sender == queue[0]);
        // Valid concert id
        require(_concertId > 0);
        require(isValidConcert(_concertId)); // use isValidConcert method

        uint256 amtToPay = 0;
        
        for (uint i = 0; i < seatIds.length; i++) {
            // Valid seat ids
            require(_seatIds[i] > 0);
            require(isValidSeat(_seatIds[i]));
            // Seat is not taken
            require(seatTaken[_concertId][_seatIds[i]] == address(0));

            amtToPay += concertContract.getSeatCost(_seatIds[i]);
        }

        // Eth sent is enough
        require(msg.value >= amtToPay);

        for (uint i = 0; i < seatIds.length; i++) {
            // Update seat status
            seatTaken[_concertId][_seatIds[i]] = msg.sender;
            seatsTaken[_concertId].push(_seatIds[i]);
            // Mint NFT
            ticketId++;
            _safeMint(msg.sender, ticketId);
            // Create ticket object
            string memory passport = _passportIds[i];
            ticketContract.createTicket(ticketId, _concertId); // check what to pass in
        }

        // Pop buyer from queue
        address[] newQueue;
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