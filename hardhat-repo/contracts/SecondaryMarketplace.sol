pragma solidity ^0.8.24;

import "./Ticket.sol";
import "./Concert.sol";
import "./Marketplace.sol";

contract SecondaryMarketplace {

    Ticket ticketContract;
    Concert concertContract;
    Marketplace primaryMarketContract;
    uint256 buyingCommission;
    uint256 sellingCommission;
    address secondaryMarketplaceContractOwner;

    bool internal locked; // State variable to prevent reentrancy

    uint256[] allListedTicketIds; // Array of all listed ticketIds
    mapping(uint256 => SecondaryMarketplace) secondaryMarketplaces; // concertId to SecondaryMarketplace mapping
    mapping(uint256 => uint256) public allListedTicketIndex; // Maps listed ticketId to its index in the allListedTicketIds array


    struct SecondaryMarketplace {
        uint256[] listedTicketIds;
        mapping(uint256 => uint256) ticketIndex; // Maps listed ticketId to its index in the listedTicketIds array
    }

    struct SecondaryMarketTicket {
        Ticket.Ticket ticket;        // Assuming starts new storage slot, depends on its definition
        address listedBy;            // 20 bytes              \
        Concert.Stage concertStage;  // 1 byte (uint8)         ) Total of 22 bytes in one slot
        bool isListed;               // 1 byte                /
    } 

    event SecondaryMarketplaceCreated(uint256 indexed concertId);
    event TicketListed(uint256 indexed ticketId, uint256 indexed concertId, address lister);
    event TicketUnListed(uint256 indexed ticketId, uint256 indexed concertId, address unlister);
    event ResaleTicketBought(uint256 indexed ticketId, uint256 indexed concertId, address seller, address buyer);
    event WithdrawBalance(address owner, uint256 bal);

    constructor(Concert concertContractAddr, Ticket ticketContractAddr, Marketplace primaryMarketContractAddr, uint256 buyingCommissionFee, uint256 sellingCommissionFee) public {
        secondaryMarketplaceContractOwner = msg.sender;
        ticketContract = ticketContractAddr;
        concertContract = concertContractAddr;
        primaryMarketContract = primaryMarketContractAddr;
        buyingCommission = buyingCommissionFee;
        sellingCommission = sellingCommissionFee;
    }

    modifier noReentrant() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier secondaryMarketplaceValidAndOpen(uint256 concertId) {
        require(concertContract.isValidConcert(concertId), "Concert does not exist");
        require(concertContract.getConcertStage(concertId) == Concert.Stage.SECONDARY_SALE, "Marketplace not open");
        _;
    }

    modifier onlySecondaryMarketplaceContractOwner() {
        require(msg.sender == secondaryMarketplaceContractOwner, "Not owner of SecondaryMarketplace contract");
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
        SecondaryMarketplace storage newSecondaryMarketplace = secondaryMarketplaces[concertId];
        emit SecondaryMarketplaceCreated(concertId);
    }

    // reseller list ticket
    function listTicket(uint256 ticketId) public secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId)) onlyTicketOwner(ticketId) {
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId);

        secondaryMarketplaces[concertId].listedTicketIds.push(ticketId);
        secondaryMarketplaces[concertId].ticketIndex[ticketId] = secondaryMarketplaces[concertId].listedTicketIds.length - 1;

        allListedTicketIds.push(ticketId);
        allListedTicketIndex[ticketId] = allListedTicketIds.length - 1;

        emit TicketListed(ticketId, concertId, msg.sender);
    }

    function unlistTicket(uint256 ticketId) public secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId)) onlyTicketOwner(ticketId) {
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId);

        removeElement(secondaryMarketplaces[concertId].listedTicketIds, secondaryMarketplaces[concertId].ticketIndex, ticketId);
        removeElement(allListedTicketIds, allListedTicketIndex, ticketId);

        emit TicketUnListed(ticketId, concertId, msg.sender);
    }

    // Function to buy tickets, protected against reentrancy, follows Check-Effects-Interaction pattern
    function buyTicket(uint256 ticketId, string memory passportId) public payable secondaryMarketplaceValidAndOpen(ticketContract.getConcertIdFromTicketId(ticketId)) noReentrant {
        // Checks
        require(ticketContract.ownerOf(ticketId) != msg.sender, "Owner cannot buy own listed ticket");
        uint256 ticketPrice = ticketContract.getTicketCost(ticketId);
        require(msg.value >= ticketPrice + buyingCommission, "Insufficient amount to buy");
        
        uint256 excessWei = msg.value - (ticketPrice + buyingCommission);
        address ticketOwner = ticketContract.ownerOf(ticketId);

        // Effects - Securely updating state before external calls
        uint256 concertId = ticketContract.getConcertIdFromTicketId(ticketId);
        removeElement(secondaryMarketplaces[concertId].listedTicketIds, secondaryMarketplaces[concertId].ticketIndex, ticketId);
        removeElement(allListedTicketIds, allListedTicketIndex, ticketId);

        // Interaction - Handling payments securely
        // 1. Transfer excess wei back to buyer
        // 2. Buyer transfers ticket to seller, now that organiser received buyer money, organiser transfer eth to seller
        payable(msg.sender).transfer(excessWei);
        payable(ticketOwner).transfer(ticketPrice - sellingCommission);
        ticketContract.transferFrom(ticketOwner, msg.sender, ticketId);
        ticketContract.updateTicketPassportId(ticketId, passportId);

        emit ResaleTicketBought(ticketId, concertId, ticketOwner, msg.sender);
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
        uint256[] memory listedTicketIds = getAllListedTickets();
        SecondaryMarketTicket[] memory ticketDetailsArr = new SecondaryMarketTicket[](listedTicketIds.length);
        for (uint256 i = 0; i < listedTicketIds.length; i++) {
            Ticket.Ticket memory ticket = ticketContract.getTicketDetailsFromTicketId(listedTicketIds[i]);
            address listedBy = ticketContract.ownerOf(ticket.ticketId);
            bool isListed = true;
            Concert.Stage concertStage = concertContract.getConcertStage(ticket.concertId);
            SecondaryMarketTicket memory newSecondaryMarketTicket = SecondaryMarketTicket(ticket, listedBy, concertStage, isListed);
            ticketDetailsArr[i] = newSecondaryMarketTicket;
        }
        return ticketDetailsArr;
    }

    function getOwnedTicketDetailsArray() public view returns (SecondaryMarketTicket[] memory) {
        Ticket.Ticket[] memory ownedTickets = ticketContract.getOwnedTickets(msg.sender);
        SecondaryMarketTicket[] memory ticketDetailsArr = new SecondaryMarketTicket[](ownedTickets.length);
        for (uint256 i = 0; i < ownedTickets.length; i++) {
            Ticket.Ticket memory ticket = ownedTickets[i];
            address listedBy = address(0);
            bool isListed = isTicketIdListed(ticket.ticketId);
            Concert.Stage concertStage = concertContract.getConcertStage(ticket.concertId);
            SecondaryMarketTicket memory newOwnedTicket = SecondaryMarketTicket(ticket, listedBy, concertStage, isListed);
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

    function updateBuyingCommission(uint256 newBuyingCommissionFee) public onlySecondaryMarketplaceContractOwner {
        buyingCommission = newBuyingCommissionFee;
    }

    function updateSellingCommission(uint256 newSellingCommissionFee) public onlySecondaryMarketplaceContractOwner {
        sellingCommission = newSellingCommissionFee;
    }

    // Efficiently remove element from an array using a swap and delete method
    function removeElement(uint256[] storage array, mapping(uint256 => uint256) storage indexMap, uint256 element) internal {
        uint256 index = indexMap[element];
        uint256 lastElement = array[array.length - 1];

        array[index] = lastElement;
        indexMap[lastElement] = index;

        array.pop();
        delete indexMap[element];
    }
}