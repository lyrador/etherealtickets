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
        totalConcerts += 1; // Incremenets the totalConcertId;
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
        uint256 concertID,
        string memory _name,
        string memory _location,
        uint256[] memory _ticketCost,
        uint24[] memory _categorySeatNumber,
        uint256 _concertDate,
        uint256 _salesDate,
        Stage nextStage
    ) public onlyOwner {
        require(concerts[concertID].id != 0, "Concert does not exist");
        
        concerts[concertID].name = _name;
        concerts[concertID].location = _location;
        concerts[concertID].ticketCost = _ticketCost;
        concerts[concertID].categorySeatNumber = _categorySeatNumber;
        concerts[concertID].concertDate = _concertDate;
        concerts[concertID].salesDate = _salesDate;
        // concert organizer manually updates stage
        concerts[concertID].stage = nextStage;
    }

    //updating the concert stage only
    function updateConcertStage(
        uint256 concertID
    ) public onlyOwner {
        require(concerts[concertID].id != 0, "Concert does not exist");
        Stage nextStage = Stage(uint8(concerts[concertID].stage) + 1);
        // concert organizer manually updates stage
        concerts[concertID].stage = nextStage;
    }

    //deleting the concert
    function deleteConcert(uint256 concertID) public onlyOwner {
        require(concerts[concertID].id != 0, "Concert does not exist");
        delete concerts[concertID];
    }

    //getting the concert id
    function getConcertID(uint256 concertID) public view returns (uint256) {
    require(concerts[concertID].id != 0, "Concert does not exist");
    return concertID;
    }

    // //getting the total cost of the concert based on the tickets and the cost of each ticket
    // function getConcertCost (uint256 concertID) public view returns (uint256) {
    //     require(concerts[concertID].id != 0, "Concert does not exist");
    //     require(concerts[concertID].categorySeatNumber.length === concerts[concertID].ticketCost.length, "Number of categorys and cost per category length does not match");

    //     uint256 cost = 0;
    //     uint256 lengthOfCategories = concerts[concertID].categorySeatNumber.length;

    //     for (uint256 j = 0; j < lengthOfCategories; j++) {
    //         cost += concerts[concertID].categorySeatNumber[j] * concerts[concertID].ticketCost[j]
    //     }

    //     return cost;
    // }

    //getting the total cost of the concert based on the tickets and the cost of each ticket
    function getSeatCost(uint256 concertID, uint24 seatNumber) public view returns (uint256) {
        require(concerts[concertID].id != 0, "Concert does not exist");
        require(seatNumber <= getTotalTickets(concertID), "Seat number is not avaliable");

        uint24 totalSeatsChecker = 0;

        for (uint24 i = 0; i < concerts[concertID].categorySeatNumber.length; i++) {
            totalSeatsChecker += concerts[concertID].categorySeatNumber[i];

            if (seatNumber <= totalSeatsChecker) {
                return concerts[concertID].ticketCost[i];
            }
        }
    }

    
    //getting the total number of tickets in the concert
    function getTotalTickets(uint256 concertID) public view returns (uint24) {
        require(concerts[concertID].id != 0, "Concert does not exist");

        uint24 totalTickets = 0;
        uint256 numOfCategory = concerts[concertID].categorySeatNumber.length;
        for (uint256 i = 0; i < numOfCategory; i++) {
            totalTickets += concerts[concertID].categorySeatNumber[i];
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
    function isValidConcert(uint256 concertID) public view returns (bool) {
    return concerts[concertID].id != 0;
    }

    function isValidSeat(uint256 concertID, uint24 seatNumber) public view returns (bool) {
        require(concerts[concertID].id != 0, "Concert does not exist");
        require(seatNumber <= getTotalTickets(concertID), "Seat does not exist");

        //since the require above already checks if the seat number inputted is valid
        return true;
    }


    //check concert stage
    function getConcertStage(uint256 concertID) public view returns (Stage) {
        return concerts[concertID].stage;
    }
}