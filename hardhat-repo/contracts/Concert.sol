// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Concert {

    uint256 public totalConcerts;

    struct Concert {
        uint256 id;
        string name;
        string location;
        uint256[] ticketCost;
        uint24[] categorySeatNumber;
        datetime concertDate;
        datetime salesDate;
        //datetime primaryMarketOpen
        //datetime secondaryMarketOpen
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    //mapping of concert id to the concerts 
    mapping(uint256 => Concert) concerts; 


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
            _salesDate
            );
    }
    
    function getConcertID(uint256 concertID) public view returns (uint256) {
    require(concerts[concertID].id != 0, "Concert does not exist");
    return concertID;
    }
}