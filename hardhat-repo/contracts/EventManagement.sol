// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import "./ConcertTicket.sol";

// contract EventManagement {
//     address private owner;
//     ConcertTicket private concertTicket;

//     struct Event {
//         uint256 id;
//         string name;
//         string venue;
//         uint256 dateTime;
//         uint256 ticketCapacity;
//     }
//     Event[] public events;

//     modifier onlyOwner() {
//         require(msg.sender == owner, "Only the owner can perform this action.");
//         _;
//     }

//     constructor(address concertTicketAddress) {
//         concertTicket = ConcertTicket(concertTicketAddress);
//         owner = msg.sender;
//     }

//     // propose that only the admin owns and calls the functions, and has a team that liases with venues, event organisers, artists etc
//     function createEventAndMintTickets(
//         string memory name,
//         string memory venue,
//         uint256 dateTime,
//         uint256 ticketCapacity,
//         address eventOrganiser
//     ) external onlyOwner {
//         uint256 eventId = events.length;
//         events.push(Event(eventId, name, venue, dateTime, ticketCapacity));

//         // Mint tickets for this event, event organiser will be the first owner of the tickets
//         concertTicket.mintTickets(eventOrganiser, eventId, ticketCapacity);
//     }

//     // Function to retrieve event details by ID
//     function getEvent(uint256 eventId) external view returns (Event memory) {
//         require(eventId < events.length, "Event does not exist.");
//         return events[eventId];
//     }

// }