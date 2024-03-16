pragma solidity ^0.8.24;

import "./StateDefinition.sol";
import "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";

contract SecondaryMarketplace is StateDefinition {
    using DoubleEndedQueue for DoubleEndedQueue.Queue;

    // Determine whether can buy tickets

    //eventId to secondaryMarketplace
    mapping(uint256 => secondaryMarketplace) secondaryMarketplaces;

    struct secondaryMarketplace {
        marketplaceState state;
        address owner;
        uint256[] listedTicketIds;
        DoubleEndedQueue.Queue queue;
    }

    // probably abstract to Ticket.sol
    struct Ticket {
        uint price;
        uint seatNum;
        address owner;
        string category;
        //address reserved;
        bool purchased;
    }

    Ticket ticketContract;
    Concert concertContract;
    uint256 buyingCommission;
    uint256 sellingCommission;

    constructor(Ticket ticketContractAddr, Concert concertContractAddr) public {
        // only admin can deploy this contract
        organizer = msg.sender;
        state = State.Closed;
        ticketContract = ticketContractAddr;
        concertContract = concertContractAddr;
        buyingCommission = 500; //500 wei is abt 1.55usd
        sellingCommission = 500;
    }

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only the organizer can call this function");
        _;
    }

    modifier atState(State _state) {
        require(state == _state);
        _;
    }

    function createSecondaryMarketplace(uint256 concertId) public {
        require(concertContract.isValidConcert(concertId), "Concert does not exist");
        require(msg.sender = concertContract.getOwner(), "Not owner of concert contract");
        secondaryMarketplace memory newSecondaryMarketplace = secondaryMarketplace(marketplaceState.Closed, msg.sender, []);
        secondaryMarketplaces[eventId] = new newSecondaryMarketplace;
    }

    // resller sell ticket
    function sellTicket(uint256 ticketId) public payable {
        require(concertContract.isValidTicket(ticketId), "Ticket does not exist");
        require(ticketContract.getOwner(ticketId) = msg.sender, "Not owner of ticket");

        require(msg.value >= sellingCommission, "Insufficient amount to sell");
        uint256 excessWei = msg.value - sellingCommission;
        payable(msg.sender).transfer(excessWei);

        uint256 eventId = ticketContract.getEventIdFromTicketId(ticketId);
        // list ticket on secondary marketplace
        ticketContract.transferFrom(msg.sender, address(this), ticketId);
        secondaryMarketplaces[eventId].listedTicketIds.push(ticketId);
    }

    function buyTicket(uint256 ticketId) public payable {
        // Validate if buyer is at the front of the queue aka, require(msg.sender == peekFront());???
        require(concertContract.isValidTicket(ticketId), "Ticket does not exist");
        uint256 ticketPrice = ticketContract.getPrice(ticketId);

        require(msg.value >= ticketPrice, "Insufficient amount to buy");
        uint256 excessWei = msg.value - (ticketPrice + buyingCommission);
        payable(msg.sender).transfer(excessWei);

        // Buyer transfers eth to organizer
        address ticketOwner = ticketContract.getOwner(ticketId);
        ticketContract.transferFrom(address(this), msg.sender, ticketId);
        removeElement(secondaryMarketplaces[eventId].listedTicketIds, ticketId);
    }

    //function to remove an array slightly more efficiently by swapping element with last
    function removeElement(address[] storage array, address element) internal {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break; 
            }
        }
    }

    // //if can buy 4 tickets, enqueue address 4 times??
    // function joinQueue(uint256 marketId) public {
    //     enqueueAddress(marketId, msg.sender);
    // }

    // function transferTickets() public atState(State.Open) onlyOrganizer {

    //     // Transfer ticket that buyer bought to buyer
    //     tickets[currTicketBought].owner = msg.sender;

    //     // Remove first user from queue

    //     currTicketBought = 0;
    // }

    // function enqueueAddress(uint256 marketId, address addr) public {
    //     // Ensure the marketplace exists
    //     require(secondaryMarketplaces[marketId] != 0, "Marketplace does not exist");
    //     // Add a ticket ID to the queue
    //     secondaryMarketplaces[marketId].queue.pushBack(addr);
    // }

    // function dequeueAddress(uint256 marketId) public returns (address) {
    //     // Ensure the marketplace exists
    //     require(secondaryMarketplaces[marketId] != 0, "Marketplace does not exist");
    //     require(!secondaryMarketplaces[marketId].queue.empty(), "Queue is empty");
    //     // Remove an address from the front of queue and return it
    //     return secondaryMarketplaces[marketId].queue.popFront();
    // }

    // function peekFront(uint256 marketId) public view returns (address) {
    //     require(!secondaryMarketplaces[marketId].queue.empty(), "Queue is empty");
    //     return secondaryMarketplaces[marketId].queue.first();
    // }
}