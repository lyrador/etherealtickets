// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Concert {

    address public owner;
    uint256 public totalConcerts;

    enum Stage {
        INITIALIZATION,
        PRIMARY_SALE,
        SECONDARY_SALE,
        OPEN,
        COMPLETED
    }

    struct Concert {
        uint256 id;
        string name;
        string location;
        uint256[] ticketCost; // change it to wei
        uint24[] categorySeatNumber;
        uint concertDate;
        uint salesDate;
        Stage stage;
    }

    constructor() {
        owner = msg.sender;
    }

    //getting the owner
    function getOwner() public view returns (address) {
        return owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    //mapping of concert id to the concerts 
    mapping(uint256 => Concert) concerts; 

    //creating a concert
    function createConcert(
        string memory _name,
        string memory _location,
        uint256[] memory _ticketCost,
        uint24[] memory _categorySeatNumber,
        uint256 _concertDate,
        uint256 _salesDate
    ) public onlyOwner {
        require(_ticketCost.length != 0,"ticketCost array cannot be empty");
        require(_categorySeatNumber.length != 0,"categorySeatNumber array cannot be empty");
        require(_ticketCost.length == _categorySeatNumber.length, "ticketCost and categorySeatNumber arrays must have the same length");
        totalConcerts += 1; // Incremenets the totalconcertId;
        concerts[totalConcerts] = Concert(
            totalConcerts,
            _name,
            _location,
            _ticketCost,
            _categorySeatNumber,
            _concertDate,
            _salesDate,
            Stage.INITIALIZATION
            );
    }
    
    //updating the concert details
    function updateConcert(
        uint256 concertId,
        string memory _name,
        string memory _location,
        uint256[] memory _ticketCost,
        uint24[] memory _categorySeatNumber,
        uint256 _concertDate,
        uint256 _salesDate
    ) public onlyOwner {
        require(concerts[concertId].id != 0, "Concert does not exist");
        
        concerts[concertId].name = _name;
        concerts[concertId].location = _location;
        concerts[concertId].ticketCost = _ticketCost;
        concerts[concertId].categorySeatNumber = _categorySeatNumber;
        concerts[concertId].concertDate = _concertDate;
        concerts[concertId].salesDate = _salesDate;
        // concert organizer manually updates stage
    }

    //updating the concert stage only
    function updateConcertStage(
        uint256 concertId
    ) public onlyOwner {
        require(concerts[concertId].id != 0, "Concert does not exist");
        Stage nextStage = Stage(uint8(concerts[concertId].stage) + 1);
        // concert organizer manually updates stage
        concerts[concertId].stage = nextStage;
    }

    //deleting the concert
    function deleteConcert(uint256 concertId) public onlyOwner {
        require(concerts[concertId].id != 0, "Concert does not exist");
        require(concerts[concertId].stage == Stage.INITIALIZATION, "Concert can only be deleted at INITIALIZATION stage");
        delete concerts[concertId];
    }

    //getting the concert id
    function getConcertID(uint256 concertId) public view returns (uint256) {
    require(concerts[concertId].id != 0, "Concert does not exist");
    return concertId;
    }

    //getting the name of the concert
    function getName(uint256 concertId) public view returns (string memory) {
        return concerts[concertId].name;
    }

    //getting the location of the concert
    function getLocation(uint256 concertId) public view returns (string memory) {
        return concerts[concertId].location;
    }

    //getting the array of the ticketcost of the concert
    function getTicketCostArray(uint256 concertId) public view returns (uint256[] memory) {
        return concerts[concertId].ticketCost;
    }

    //getting the array fo the categorySeats
    function getCategorySeatArray(uint256 concertId) public view returns (uint24[] memory) {
        return concerts[concertId].categorySeatNumber;
    }

    ///getting the concertDate of the concert
    function getConcertDate(uint256 concertId) public view returns (uint) {
        return concerts[concertId].concertDate;
    }

    //getting the salesDate of the concert
    function getSalesDate(uint256 concertId) public view returns (uint) {
        return concerts[concertId].salesDate;
    }


    //getting the cost of the seat by iterating through the categories
    function getSeatCost(uint256 concertId, uint24 seatNumber) public view returns (uint256) {
        require(concerts[concertId].id != 0, "Concert does not exist");
        require(seatNumber <= getTotalTickets(concertId), "Seat number is not available");

        uint24 totalSeatsChecker = 0;

        for (uint24 i = 0; i < concerts[concertId].categorySeatNumber.length; i++) {
            totalSeatsChecker += concerts[concertId].categorySeatNumber[i];

            if (seatNumber <= totalSeatsChecker) {
                return concerts[concertId].ticketCost[i];
            }
        }
    }

    //getting the category of the seat
    function getSeatCategory(uint256 concertId, uint24 seatNumber) public view returns (uint24) { 
        require(concerts[concertId].id != 0, "Concert does not exist");
        require(seatNumber <= getTotalTickets(concertId), "Seat number is not available");

        uint24 totalSeatsChecker = 0; 
        uint24 category = 0;

        for (uint24 i = 0; i < concerts[concertId].categorySeatNumber.length; i++) {
            totalSeatsChecker += concerts[concertId].categorySeatNumber[i];
        
            if (seatNumber <= totalSeatsChecker) {
                category = i;
                break; // found the category, exit the loop
            }
        }
        return category; 
    }

    
    //getting the total number of tickets in the concert
    function getTotalTickets(uint256 concertId) public view returns (uint24) {
        require(concerts[concertId].id != 0, "Concert does not exist");

        uint24 totalTickets = 0;
        uint256 numOfCategory = concerts[concertId].categorySeatNumber.length;
        for (uint256 i = 0; i < numOfCategory; i++) {
            totalTickets += concerts[concertId].categorySeatNumber[i];
        }

        return totalTickets;
    }

    //getting the total number of tickets for each category 
    function getTotalTicketsForCategory(uint256 concertID, uint256 categoryNumber) public view returns (uint24) {
        require(concerts[concertID].id != 0, "Concert does not exist");
        require(categoryNumber < concerts[concertID].categorySeatNumber.length, "Category index out of bounds");
        return concerts[concertID].categorySeatNumber[categoryNumber - 1];
    }

    //checking if the concert is valid or not
    function isValidConcert(uint256 concertId) public view returns (bool) {
        return concerts[concertId].id != 0;
    }

    function isValidSeat(uint256 concertId, uint24 seatNumber) public view returns (bool) {
        require(concerts[concertId].id != 0, "Concert does not exist");
        require(seatNumber <= getTotalTickets(concertId), "Seat does not exist");

        //since the require above already checks if the seat number inputted is valid
        return true;
    }


    //check concert stage
    function getConcertStage(uint256 concertId) public view returns (Stage) {
        return concerts[concertId].stage;
    }

    // get list of concerts by stage
    function getConcertsByStage(uint stageInt) public view returns (Concert[] memory) {
        
        Stage stage = Stage(stageInt);
        
        uint count = 0;
        for (uint i = 1; i <= totalConcerts; i++) {
            if (concerts[i].stage == stage) {
                count++;
            }
        }

        Concert[] memory requiredConcerts = new Concert[](count);
        uint index = 0;
        for (uint i = 1; i <= totalConcerts; i++) {
            if (concerts[i].stage == stage) {
                requiredConcerts[index] = concerts[i];
                index++;
            }
        }

        return requiredConcerts;
    }

    // get concert details from concertId
    function getConcertDetailsFromConcertId(uint256 concertId) public view returns (Concert memory) {
        return concerts[concertId];
    }
}
