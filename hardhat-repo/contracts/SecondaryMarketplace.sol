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

    struct OwnedTicket {
        uint256 ticketId;
        uint256 concertId;
        uint24 category;
        uint256 cost; 
        string passportId; 
        string concertName;
        string concertLocation;
        uint concertDate;
        bool isListed;
        bool isSecondarySaleStage;
    }

    uint256[] allListedTicketIds;

    Ticket ticketContract;
    Concert concertContract;
    Marketplace primaryMarketContract;
    uint256 buyingCommission;
    uint256 sellingCommission;
    address secondaryMarketplaceContractOwner;

    event SecondaryMarketplaceCreated(uint256 indexed concertId);
    event TicketListed(uint256 indexed ticketId, uint256 indexed concertId, address lister);
    event TicketUnListed(uint256 indexed ticketId, uint256 indexed concertId, address unlister);
    event ResaleTicketBought(uint256 indexed ticketId, uint256 indexed concertId, address seller, address buyer);
    event WithdrawBalance(address owner, uint256 bal);

    constructor(Concert concertContractAddr, Ticket ticketContractAddr, Marketplace primaryMarketContractAddr) public {
        secondaryMarketplaceContractOwner = msg.sender;
        ticketContract = ticketContractAddr;
        concertContract = concertContractAddr;
        primaryMarketContract = primaryMarketContractAddr;
        buyingCommission = 500; //500 wei is abt 1.55usd
        sellingCommission = 500;
    }

    modifier secondaryMarketplaceValidAndOpen(uint256 concertId) {
        require(concertContract.isValidConcert(concertId), "Concert does not exist");
        require(concertContract.getConcertStage(concertId) == Concert.Stage.SECONDARY_SALE, "Marketplace not open");
        _;
    }

    modifier onlySecondaryMarketplaceContractOwner() {
        require(msg.sender == secondaryMarketplaceContractOwner, "Not owner of secondaryMarketplace contract");
        _;
    }

    modifier onlyConcertContractOwner() {
        require(msg.sender == concertContract.getOwner(), "Not owner of concert contract");
        _;
    }

    modifier onlyTicketOwner(uint256 ticketId) {
        require(ticketContract.ownerOf(ticketId) == msg.sender, "Not owner of ticket");
        _;
    }

    function createSecondaryMarketplace(uint256 concertId) public secondaryMarketplaceValidAndOpen(concertId) onlyConcertContractOwner {
        uint256[] memory initialTickets;
        secondaryMarketplace memory newSecondaryMarketplace = secondaryMarketplace(msg.sender, initialTickets);
        secondaryMarketplaces[concertId] = newSecondaryMarketplace;
        emit SecondaryMarketplaceCreated(concertId);
    }

    // reseller list ticket
    function listTicket(uint256 ticketId) public secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId)) onlyTicketOwner(ticketId) {
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId);
        secondaryMarketplaces[concertId].listedTicketIds.push(ticketId);
        allListedTicketIds.push(ticketId);
        emit TicketListed(ticketId, concertId, msg.sender);
    }

    function unlistTicket(uint256 ticketId) public secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId)) onlyTicketOwner(ticketId) {
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId);
        removeElement(secondaryMarketplaces[concertId].listedTicketIds, ticketId);
        removeElement(allListedTicketIds, ticketId);
        emit TicketUnListed(ticketId, concertId, msg.sender);
    }

    function buyTicket(uint256 ticketId, string memory passportId) public payable secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId)) {
        require(ticketContract.ownerOf(ticketId) != msg.sender, "Owner cannot buy own listed ticket");

        uint256 ticketPrice = ticketContract.getTicketCost(ticketId);
        require(msg.value >= ticketPrice + buyingCommission, "Insufficient amount to buy");
        uint256 excessWei = msg.value - (ticketPrice + buyingCommission);
        payable(msg.sender).transfer(excessWei);

        // Buyer transfers ticket to seller, now that organiser received buyer money, organiser transfer eth to seller
        address ticketOwner = ticketContract.ownerOf(ticketId);
        payable(ticketOwner).transfer(ticketPrice - sellingCommission);
        ticketContract.transferFrom(ticketOwner, msg.sender, ticketId);
        ticketContract.updateTicketPassportId(ticketId, passportId);

        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId);
        removeElement(secondaryMarketplaces[concertId].listedTicketIds, ticketId);
        removeElement(allListedTicketIds, ticketId);
        emit ResaleTicketBought(ticketId, concertId, ticketOwner, msg.sender);
    }

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
            address listedBy = ticketContract.ownerOf(ticketId);
            SecondaryMarketTicket memory newSecondaryMarketTicket = SecondaryMarketTicket(ticketId, concertId, prevTicketOwner, category, cost, passportId, concertName, concertLocation, concertDate, listedBy);
            ticketDetailsArr[i] = newSecondaryMarketTicket;
        }
        return ticketDetailsArr;
    }

    function getOwnedTicketDetailsArray() public view returns (OwnedTicket[] memory) {
        // for loop size
        Ticket.Ticket[] memory ownedTickets = ticketContract.getOwnedTickets(msg.sender);
        OwnedTicket[] memory ticketDetailsArr = new OwnedTicket[](ownedTickets.length);
        for (uint256 i = 0; i < ownedTickets.length; i++) {
            Ticket.Ticket memory ticket = ownedTickets[i];
            Concert.Concert memory concert = concertContract.getConcertDetailsFromConcertId(ticket.concertId);
            uint256 ticketId = ticket.ticketId;
            uint256 concertId = ticket.concertId;
            uint24 category = ticket.category;
            uint256 cost = ticket.cost; 
            string memory passportId = ticket.passportId; 
            string memory concertName = concert.name;
            string memory concertLocation = concert.location;
            uint concertDate = concert.concertDate;
            bool isListed = isTicketIdListed(ticketId);
            bool isSecondarySaleStage = (concert.stage == Concert.Stage(2));
            OwnedTicket memory newOwnedTicket = OwnedTicket(ticketId, concertId, category, cost, passportId, concertName, concertLocation, concertDate, isListed, isSecondarySaleStage);
            ticketDetailsArr[i] = newOwnedTicket;
        }
        return ticketDetailsArr;
    }

    function getBuyingCommission() public view returns (uint256) {
        return buyingCommission;
    }

    function getSellingCommission() public view returns (uint256) {
        return sellingCommission;
    }

    function isTicketIdListed(uint256 ticketId) internal view returns (bool) {
        for (uint i = 0; i < allListedTicketIds.length; i++) {
            if (allListedTicketIds[i] == ticketId) {
                return true;
                break; 
            }
        }
        return false;
    }

    function getBalance() public view onlySecondaryMarketplaceContractOwner returns (uint256) {
        return address(this).balance;
    }

    function withdrawAll() public payable onlySecondaryMarketplaceContractOwner {
        uint256 bal = address(this).balance;
        payable(secondaryMarketplaceContractOwner).transfer(bal);
        emit WithdrawBalance(secondaryMarketplaceContractOwner, bal);
    }
}