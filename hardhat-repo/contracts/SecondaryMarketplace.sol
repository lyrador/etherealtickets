pragma solidity ^0.8.24;

import "./StateDefinition.sol";

contract SecondaryMarketplace is StateDefinition {

    // Determine whether can buy tickets

    //eventId to secondaryMarketplace
    mapping(uint256 => secondaryMarketplace) secondaryMarketplaces;

    struct secondaryMarketplace {
        marketplaceState state;
        address owner;
        address prevOwner;
    }

    // Buyer queue    
    address[] queue;

    // probably abstract to Ticket.sol
    struct Ticket {
        uint price;
        uint seatNum;
        address owner;
        string category;
        //address reserved;
        bool purchased;
    }

    constructor() public {
        // event organizer to deploy this contract
        organizer = msg.sender;
        ticketCount = 0;
        state = State.Closed;
    }

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only the organizer can call this function");
        _;
    }

    modifier atState(State _state) {
        require(state == _state);
        _;
    }

    function createSecondaryMarketplace(uint256 eventId) public {
        //require(validEventId);
        //require(msg.sender owns event)

        //new secondarymarketplace object
        secondaryMarketplace memory newSecondaryMarketplace = secondaryMarketplace(marketplaceState.Closed, msg.sender, address(0));

        secondaryMarketplaces[eventId] = new newSecondaryMarketplace;
    }

    // resller sell tickets
    function sellTickets(uint256 ticketId) public onlyOrganizer {
        //require(ticket matches event, owner indeed has ticket);
        //ticketCount--; ??
        //destroy ticket? or send to contract, then buyer will buy NFT from contract
    }

    function joinQueue() public {
        queue.push(msg.sender);
    }

    // function pay(uint ticketId) public payable atState(State.Open) {
    //     // Validate if buyer is at the front of the queue
    //     require(msg.sender == queue[0]);

    //     // Validate whether eth sent is the same as ticket price

    //     // Buyer transfers eth to organizer

    //     currTicketBought = ticketId;
        
    // }

    // function transferTickets() public atState(State.Open) onlyOrganizer {

    //     // Transfer ticket that buyer bought to buyer
    //     tickets[currTicketBought].owner = msg.sender;

    //     // Remove first user from queue

    //     currTicketBought = 0;
    // }

}