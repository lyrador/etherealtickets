import React from "react";
import NavBar from "./NavBar";
import Header from "./Header";
import Button from '@mui/material/Button';
import PurchaseAlertDialog from "./PurchaseAlertDialog";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import TicketPurchaseCard from "./TicketPurchaseCard";
import FinancialTable from './FinancialTable';
import { useState, useEffect } from "react";

import swift from '../images/swift-eras.jpg';
import bruno from '../images/bruno.jpg';

import { ethers } from 'ethers';
import Concert from "../contracts/Concert.json";
import Ticket from "../contracts/Ticket.json";
import Marketplace from "../contracts/Marketplace.json";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";
import { CONCERT, TICKET, MARKETPLACE, SECONDARY_MARKETPLACE } from "../constants/Address";

import { BigNumber } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

const signer = provider.getSigner();
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);
const marketplaceContract = new ethers.Contract(MARKETPLACE, Marketplace.abi, signer);
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

const content = "This transaction is not refundable. Are you sure you want to proceed?";

function Checkout() {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);
    const { state } = useLocation();
    const { ticketId, concertId, concertName, concertLoc, category, ticketCost, concertDate } = state; // Read values passed on state

    const [balance, setBalance] = useState('0');
    const [currentAcct, setCurrentAcct] = useState('');

    // Function to get the balance of the current account
    const getBalance = async (provider, account) => {
        try {
            const balance = await provider.getBalance(account);
            setBalance(ethers.utils.formatEther(balance));
        } catch (error) {
            console.error(error);
            setBalance('Failed to get balance');
        }
    };

    // let provider2 = "";

    // async function connectWallet() {
    //     if (window.ethereum) {  // Check if MetaMask is installed
    //         try {
    //             await window.ethereum.request({ method: 'eth_requestAccounts' });  // Request account access
    //             provider2 = new ethers.providers.Web3Provider(window.ethereum);
    //             return provider2.getSigner();  // Returns the signer associated with the connected account
    //         } catch (error) {
    //             console.error("Error connecting to MetaMask:", error);
    //         }
    //     } else {
    //         alert("Please install MetaMask to use this feature!");
    //     }
    // }
    
    // // Function to call approve on the contract
    // async function approveTokens() {
    //     try {
    //         const signer = await connectWallet();
    //         const connectedContract = marketplaceContract.connect(signer);
    //         const approvalResponse = await connectedContract.approve(SECONDARY_MARKETPLACE, 1);
    //         console.log('Approval transaction hash:', approvalResponse.hash);
    //     } catch (error) {
    //         console.error('Error during token approval:', error);
    //     }
    // }

    const buyTickets = async () => {
        console.log(state);
        console.log("CURRENT ACCT:");
        console.log(currentAcct);
        const TWO_ETH = ethers.utils.parseEther("2.0"); 
        //await marketplaceContract.connect(signer1).approve(SECONDARY_MARKETPLACE, 1);
        await secondaryMarketplaceContract.buyTicket(parseInt(ticketId), parseInt(concertId), {value: TWO_ETH});
        await marketplaceContract.transferFrom(MARKETPLACE, currentAcct, ticketId);
        console.log("Buy Tickets");
    }

    // Function to request account connection
    const requestAccount = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                getBalance(provider, accounts[0]);
                setCurrentAcct(accounts[0]);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.log('MetaMask is not installed');
        }
    };

    useEffect(() => {
        requestAccount();
    }, []);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    // Assuming you have a data structure for the financials like this:
    const financials = {
        balance: Number(balance),
        ticketCost: 50,
        numberOfTickets: 10,
        commissionFee: 20,
        currency: 'ETH'
    };

    // Perform calculations
    financials.totalCostOfTickets = financials.ticketCost * financials.numberOfTickets;
    financials.finalAmountToPay = financials.totalCostOfTickets - financials.commissionFee;
    financials.finalBalance = financials.balance - financials.finalAmountToPay;

    return (
        <>
            <Header />
            <h2>Checkout with ticketId : {ticketId}</h2>
            <h3>{balance}</h3>
            <TicketPurchaseCard 
                cardImg={swift} 
                concertName={concertName}
                concertLoc={concertLoc}
                category={category}
                ticketCost={ticketCost}
                concertDate={concertDate}
            />
            <div>
                <FinancialTable data={financials} />
            </div>
            <Button variant="contained" color="error" onClick={() => navigate(-1)}>Cancel checkout and return</Button>
            <>
                <Button
                    variant="contained"
                    onClick={() => buyTickets()}
                >
                    Proceed
                </Button>
                <PurchaseAlertDialog open={open} handleClose={handleClose} content={content} />
            </>
        </>
    );
}

export default Checkout;