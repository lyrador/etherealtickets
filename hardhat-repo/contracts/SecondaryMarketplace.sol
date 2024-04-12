pragma solidity ^0.8.24;

import "./StateDefinition.sol";
import "./Ticket.sol";
import "./Concert.sol";
import "./Marketplace.sol";

contract SecondaryMarketplace {

    //concertId to secondaryMarketplace
    mapping(uint256 => secondaryMarketplace) secondaryMarketplaces;

    struct secondaryMarketplace {
        address owner;
        uint256[] listedTicketIds;
    }

    struct SecondaryMarketTicket {
        uint256 ticketId;
        uint256 concertId;
        address prevTicketOwner;
        uint24 category;
        uint256 cost; 
        string passportId; 
        string concertName;
        string concertLocation;
        uint concertDate;
        address listedBy;
    }

    uint256[] allListedTicketIds;

    Ticket ticketContract;
    Concert concertContract;
    Marketplace primaryMarketContract;
    uint256 buyingCommission;
    uint256 sellingCommission;

    constructor(Concert concertContractAddr, Ticket ticketContractAddr, Marketplace primaryMarketContractAddr) public {
        // only admin can deploy this contract
        //organizer = msg.sender;
        ticketContract = ticketContractAddr;
        concertContract = concertContractAddr;
        primaryMarketContract = primaryMarketContractAddr;
        buyingCommission = 500; //500 wei is abt 1.55usd
        sellingCommission = 500;
    }

    // modifier onlyOrganizer() {
    //     require(msg.sender == organizer, "Only the organizer can call this function");
    //     _;
    // }

    modifier secondaryMarketplaceValidAndOpen(uint256 concertId) {
        require(concertContract.isValidConcert(concertId), "Concert does not exist");
        require(concertContract.getConcertStage(concertId) == Concert.Stage.SECONDARY_SALE, "Marketplace not open");
        _;
    }

    function createSecondaryMarketplace(uint256 concertId) public secondaryMarketplaceValidAndOpen(concertId) {
        require(msg.sender == concertContract.getOwner(), "Not owner of concert contract");
        uint256[] memory initialTickets;
        secondaryMarketplace memory newSecondaryMarketplace = secondaryMarketplace(msg.sender, initialTickets);
        secondaryMarketplaces[concertId] = newSecondaryMarketplace;
    }

    // reseller list ticket
    function listTicket(uint256 ticketId, string memory passportId) public secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId, passportId)) {
        require(ticketContract.isValidTicket(ticketId), "Ticket is invalid");
        require(ticketContract.getOwner(ticketId) == msg.sender, "Not owner of ticket");
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId, passportId);
        secondaryMarketplaces[concertId].listedTicketIds.push(ticketId);
        allListedTicketIds.push(ticketId);
    }

    function unlistTicket(uint256 ticketId, string memory passportId) public secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId, passportId)) {
        require(ticketContract.isValidTicket(ticketId), "Ticket is invalid");
        require(ticketContract.getOwner(ticketId) == msg.sender, "Not owner of ticket");
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId, passportId);
        // unlist ticket on secondary marketplace
        removeElement(secondaryMarketplaces[concertId].listedTicketIds, ticketId);
        removeElement(allListedTicketIds, ticketId);
    }

    function buyTicket(uint256 ticketId, uint256 concertId) public payable secondaryMarketplaceValidAndOpen(concertId) {
        require(ticketContract.isValidTicket(ticketId), "Ticket is invalid");
        require(ticketContract.getOwner(ticketId) != msg.sender, "Owner cannot buy own listed ticket");

        uint256 ticketPrice = ticketContract.getTicketCost(ticketId);
        require(msg.value >= ticketPrice + buyingCommission, "Insufficient amount to buy");
        uint256 excessWei = msg.value - (ticketPrice + buyingCommission);
        payable(msg.sender).transfer(excessWei);

        // Buyer transfers ticket to seller, now that organiser received buyer money, organiser transfer eth to seller
        address ticketOwner = ticketContract.getOwner(ticketId);
        payable(ticketOwner).transfer(ticketPrice - sellingCommission);
        ticketContract.updateTicketOwner(ticketId, msg.sender);

        removeElement(secondaryMarketplaces[concertId].listedTicketIds, ticketId);
    }

    // //if implementing this, we need to change the uint256[] listedTicketIds to 2d array where row is cat num and col is ticketId
    // function buyTicketForCategory(uint256 concertId, uint8 cat) public payable {
    //     // Validate if buyer is at the front of the queue aka, require(msg.sender == peekFront());???
    //     require(concertContract.isValidConcert(concertId), "Concert does not exist");
    //     require(secondaryMarketplaces[concertId].state = marketplaceState.Open, "Secondary marketplace is closed");
    //     uint256[] listedTicketIdsForCategory = listedTicketIds[cat];
    //     require(listedTicketIdsForCategory.length > 0, "No tickets in selected category")
        
    //     uint256 ticketId = listedTicketIdsForCategory[listedTicketIdsForCategory.length-1];
    //     uint256 ticketPrice = ticketContract.getPrice(ticketId);
    //     require(msg.value >= ticketPrice, "Insufficient amount to buy");
    //     uint256 excessWei = msg.value - (ticketPrice + buyingCommission);
    //     payable(msg.sender).transfer(excessWei);

    //     // Buyer transfers eth to organizer
    //     address ticketOwner = ticketContract.getOwner(ticketId);
    //     ticketContract.transferFrom(address(this), msg.sender, ticketId);
    //     listedTicketIdsForCategory.pop();
    // }

    //function to remove an array slightly more efficiently by swapping element with last
    function removeElement(uint256[] storage array, uint256 element) internal {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break; 
            }
        }
    }

    function getListedTicketsFromConcert(uint256 concertId) public view returns (uint256[] memory) {
        require(concertContract.isValidConcert(concertId), "Concert does not exist");
        return secondaryMarketplaces[concertId].listedTicketIds;
    }

    // get ticket details by id
    function getListedTicketDetailsArrayFromConcertId(uint256 concertId) public view returns (Ticket.Ticket[] memory) {
        // for loop size
        uint256[] memory listedTicketIds = getListedTicketsFromConcert(concertId);
        uint len = listedTicketIds.length;
        Ticket.Ticket[] memory ticketDetailsArr = new Ticket.Ticket[](len);
        for (uint256 i = 0; i < listedTicketIds.length; i++) {
            ticketDetailsArr[i] = ticketContract.getTicketDetailsFromTicketId(listedTicketIds[i]);
        }
        return ticketDetailsArr;
    }

    function getAllListedTickets() public view returns (uint256[] memory) {
        return allListedTicketIds;
    }

    function getAllListedTicketDetailsArray() public view returns (SecondaryMarketTicket[] memory) {
        // for loop size
        uint256[] memory listedTicketIds = getAllListedTickets();
        SecondaryMarketTicket[] memory ticketDetailsArr = new SecondaryMarketTicket[](listedTicketIds.length);
        for (uint256 i = 0; i < listedTicketIds.length; i++) {
            Ticket.Ticket memory ticket = ticketContract.getTicketDetailsFromTicketId(listedTicketIds[i]);
            Concert.Concert memory concert = concertContract.getConcertDetailsFromConcertId(ticket.concertId);
            uint256 ticketId = ticket.ticketId;
            uint256 concertId = ticket.concertId;
            address prevTicketOwner = ticket.prevTicketOwner;
            uint24 category = ticket.category;
            uint256 cost = ticket.cost; 
            string memory passportId = ticket.passportId; 
            string memory concertName = concert.name;
            string memory concertLocation = concert.location;
            uint concertDate = concert.concertDate;
            address listedBy = ticketContract.getOwner(ticketId);
            SecondaryMarketTicket memory newSecondaryMarketTicket = SecondaryMarketTicket(ticketId, concertId, prevTicketOwner, category, cost, passportId, concertName, concertLocation, concertDate, listedBy);
            ticketDetailsArr[i] = newSecondaryMarketTicket;
        }
        return ticketDetailsArr;
    }
}