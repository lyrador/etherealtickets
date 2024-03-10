contract Marketplace {

    // Determine whether can buy tickets
    enum State {
        Closed,
        Open
    }

    State state;
    address organizer;
    uint ticketCount;
    mapping(uint => Ticket) tickets;

    // Buyer queue    
    address[] queue;

    // Each buyer buys 1 ticket
    uint currTicketBought;

    uint256 creationTime;

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
        creationTime = block.timestamp;
    }

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only the organizer can call this function");
        _;
    }

    modifier atState(State _state) {
        require(state == _state);
        _;
    }

    modifier timedTransitions() {
        // Marketplace auto opens 1 day after deployment
        if (state == State.Closed && block.timestamp >= creationTime + 1 days) {
            state = State.Open;
        } 

        // Marketplace auto closes 2 days after deployment
        if (state == State.Open && block.timestamp >= creationTime + 2 days) {
            state = State.Closed;
        }
        _;
    }

    // Only Organizer can list tickets
    function listTicket(uint price, uint seatNum, string memory category) public onlyOrganizer {
        Ticket memory ticket = Ticket(price, seatNum, msg.sender, category, false);
        // save the ticket
        ticketCount++;
        tickets[ticketCount] = ticket;
    }

    function joinQueue() public {
        queue.push(msg.sender);
    }

    function pay(uint ticketId) public payable timedTransitions atState(State.Open) {
        // Validate if buyer is at the front of the queue
        require(msg.sender == queue[0]);

        // Validate whether eth sent is the same as ticket price

        // Buyer transfers eth to organizer

        currTicketBought = ticketId;
        
    }

    function transferTickets() public timedTransitions atState(State.Open) onlyOrganizer {

        // Transfer ticket that buyer bought to buyer
        tickets[currTicketBought].owner = msg.sender;

        // Remove first user from queue

        currTicketBought = 0;
    }

}