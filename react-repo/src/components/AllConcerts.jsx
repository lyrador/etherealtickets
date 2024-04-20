import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import NavBar from "./NavBar";
import Header from "./Header";
import Concert from "../contracts/Concert.json";
import { CONCERT, ORGANIZER } from "../constants/Address";
import { STAGE } from "../constants/Enum";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import 'bootstrap/dist/css/bootstrap.min.css';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);

function AllConcerts() {
    const [concerts, setConcerts] = useState([]);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [ticketCosts, setTicketCosts] = useState("");
    const [seatNumbers, setSeatNumbers] = useState("");
    const [dateNumber, setDateNumber] = useState(""); 
    const [currentConcert, setCurrentConcert] = useState(null);
    const [salesDate, setSalesDate] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const navigate = useNavigate();

    const getAccountOnLoad = async () => {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setIsOwner(accounts[0] == ORGANIZER);
      };
    
      const handleAccountsChanged = (accounts) => {
        setIsOwner(accounts[0] == ORGANIZER);
      };
    
      useEffect(() => {
        getAccountOnLoad();
    
        // Subscribe to Metamask account changes
        window.ethereum.on("accountsChanged", handleAccountsChanged);
      }, []);



    const fetchConcertDetails = async () => {
        try {
            const result = await concertContract.getConcertsByStage(0);
            const transformedResult = result.map(concert => {
                const res = [];
                res.push(parseInt(concert.id)); // ID
                res.push(concert.name); // Name
                res.push(concert.location); // Location
                res.push(concert.categorySeatNumber.join(", ")); // Category Seats
                res.push(concert.ticketCost.map(cost => `${ethers.utils.formatEther(cost)} ETH`).join(", ")); // Ticket Costs
                res.push(parseInt(concert.concertDate)); // Concert Date
                res.push(parseInt(concert.salesDate)) // Sales Date
                res.push(STAGE[concert.stage]); // Stage
                return res;
            });
            setConcerts(transformedResult.filter(concert => concert[0] !== 0)); // Filter out deleted concerts
        } catch (error) {
            console.error('Failed to fetch concerts:', error);
            alert('Failed to fetch concerts: ' + error.message);
        }
    };

    useEffect(() => {
        fetchConcertDetails();
    }, []); 

    const parseErrorMessage = (error) => {
        let errorMessage = "An unknown error occurred";
        if (error && error.error && error.error.data && error.error.data.message) {
            errorMessage = error.error.data.message;
        } else if (error && error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error && error.message) {
            errorMessage = error.message;
        }
        return errorMessage.replace(/(error: )|(")/gi, ""); // Clean up any additional text or quotes
    };

    const handleCreateConcert = async () => {
        const ticketCostArray = ticketCosts.split(",").map(cost => ethers.utils.parseEther(cost.trim()));
        const seatNumberArray = seatNumbers.split(",").map(num => parseInt(num.trim()));
    
        try {
            const transaction = await concertContract.createConcert(
                name,
                location,
                ticketCostArray,
                seatNumberArray,
                parseInt(dateNumber), // Concert date
                parseInt(salesDate),  // Sales start date
            );
            await transaction.wait();
    
            // After successful transaction fetch concert details again
            fetchConcertDetails();
    
            // Reset form fields
            setName('');
            setLocation('');
            setTicketCosts('');
            setSeatNumbers('');
            setDateNumber('');
            setSalesDate('');
        } catch (error) {
            alert(parseErrorMessage(error));
        }
    };
    

    const handleUpdateConcert = async () => {
        if (!currentConcert) return;

        const ticketCostArray = ticketCosts.split(",").map(cost => ethers.utils.parseEther(cost.trim()));
        const seatNumberArray = seatNumbers.split(",").map(num => parseInt(num.trim()));

        try {
            const transaction = await concertContract.updateConcert(
                currentConcert[0], // Concert ID
                name,
                location,
                ticketCostArray,
                seatNumberArray,
                parseInt(dateNumber),
                parseInt(salesDate) 
            );
            await transaction.wait();

            // After successful transaction fetch concert details again
            fetchConcertDetails();

            // Clear the update form
            setCurrentConcert(null);
            setName('');
            setLocation('');
            setTicketCosts('');
            setSeatNumbers('');
            setDateNumber('');
            setSalesDate('');
        } catch (error) {
            alert(parseErrorMessage(error));
        } 
    };

    const startUpdate = (concert) => {
        setCurrentConcert(concert);
        setName(concert[1]);
        setLocation(concert[2]);
        const cleanedTicketCosts = concert[4].replace(/ ETH/g, '').trim(); 
        setTicketCosts(cleanedTicketCosts);        setSeatNumbers(concert[3].split(", ").join(","));
        setDateNumber(concert[5]);
        setSalesDate(concert[6]);  
    };
    

    const handleDeleteConcert = async (id) => {
        try {
            const txResponse = await concertContract.deleteConcert(id);
            await txResponse.wait(); // Ensures the transaction is confirmed on the blockchain
            
            // Filter out the deleted concert by ID and update the state
            const updatedConcerts = concerts.filter(concert => concert[0] !== id);
            setConcerts(updatedConcerts);
    
        } catch (error) {
            alert(parseErrorMessage(error));
        }
    };

    return (
        <>
            <Header />
            <NavBar />
            <h2>Concert Management</h2>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control type="text" placeholder="Enter concert name" value={name} onChange={e => setName(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control type="text" placeholder="Enter location" value={location} onChange={e => setLocation(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Ticket Costs (ETH, comma-separated)</Form.Label>
                    <Form.Control type="text" placeholder="Enter ticket costs" value={ticketCosts} onChange={e => setTicketCosts(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Seat Numbers (comma-separated)</Form.Label>
                    <Form.Control type="text" placeholder="Enter seat numbers" value={seatNumbers} onChange={e => setSeatNumbers(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Concert Date</Form.Label>
                    <Form.Control type="number" placeholder="Enter a number" value={dateNumber} onChange={e => setDateNumber(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Sales Start Date</Form.Label>
                    <Form.Control type="number" placeholder="Enter the sales start date" value={salesDate} onChange={e => setSalesDate(e.target.value)} />
                </Form.Group>

                {currentConcert ? (
                    <Button variant="success" onClick={handleUpdateConcert}>Update Concert</Button>
                ) : (
                    <Button variant="primary" onClick={handleCreateConcert}>Create Concert</Button>
                )}
            </Form>
            <Table striped bordered hover>
                <thead>
                    <tr>
                         <th>ID</th>
                         <th>Name</th>
                         <th>Location</th>
                         <th>Category Seats</th>
                         <th>Ticket Costs</th>
                         <th>Concert Date</th>
                         <th>Sales Date</th>
                         <th>Stage</th>
                         <th>Update</th>
                         <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                {concerts.map((concert, index) => (
                    <tr key={index}>
                        <td>{concert[0]}</td>
                        <td>{concert[1]}</td>
                        <td>{concert[2]}</td>
                        <td>{concert[3]}</td>
                        <td>{concert[4]}</td>
                        <td>{concert[5]}</td>
                        <td>{concert[6]}</td>
                        <td>{concert[7]}</td>
                        <td>
                            <Button onClick={() => startUpdate(concert)}>Update</Button>
                        </td>
                        <td>
                            <Button variant="danger" onClick={() => handleDeleteConcert(concert[0])}>Delete</Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </>
    );
}

export default AllConcerts;

