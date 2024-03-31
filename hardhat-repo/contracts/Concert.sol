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
        uint256[] ticketCost;
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
        uint256 _salesDate,
        Stage nextStage
    ) public onlyOwner {
        require(concerts[concertId].id != 0, "Concert does not exist");
        
        concerts[concertId].name = _name;
        concerts[concertId].location = _location;
        concerts[concertId].ticketCost = _ticketCost;
        concerts[concertId].categorySeatNumber = _categorySeatNumber;
        concerts[concertId].concertDate = _concertDate;
        concerts[concertId].salesDate = _salesDate;
        // concert organizer manually updates stage
        concerts[concertId].stage = nextStage;
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
        delete concerts[concertId];
    }

    //getting the concert id
    function getconcertId(uint256 concertId) public view returns (uint256) {
    require(concerts[concertId].id != 0, "Concert does not exist");
    return concertId;
    }

    // //getting the total cost of the concert based on the tickets and the cost of each ticket
    // function getConcertCost (uint256 concertId) public view returns (uint256) {
    //     require(concerts[concertId].id != 0, "Concert does not exist");
    //     require(concerts[concertId].categorySeatNumber.length === concerts[concertId].ticketCost.length, "Number of categorys and cost per category length does not match");

    //     uint256 cost = 0;
    //     uint256 lengthOfCategories = concerts[concertId].categorySeatNumber.length;

    //     for (uint256 j = 0; j < lengthOfCategories; j++) {
    //         cost += concerts[concertId].categorySeatNumber[j] * concerts[concertId].ticketCost[j]
    //     }

    //     return cost;
    // }

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
    function getTotalTicketsForCategory(uint256 concertId, uint256 categoryNumber) public view returns (uint24) {
        require(concerts[concertId].id != 0, "Concert does not exist");
        require(categoryNumber < concerts[concertId].categorySeatNumber.length, "Category index out of bounds");
        return concerts[concertId].categorySeatNumber[categoryNumber];
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
}
