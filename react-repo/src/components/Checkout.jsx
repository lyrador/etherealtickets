import React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import NavBar from "./NavBar";
import Header from "./Header";
import PurchaseAlertDialog from "./PurchaseAlertDialog";
import TicketPurchaseCard from "./TicketPurchaseCard";
import FinancialTable from './FinancialTable';

import { Button, Backdrop, CircularProgress } from '@mui/material';

import swift from '../images/swift-eras.jpg';
import bruno from '../images/bruno.jpg';
import edsheeran from '../images/edsheeran.jpg';
import concertpic from '../images/concertOne.jpg'

import { ethers } from "ethers";

import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";
import { SECONDARY_MARKETPLACE } from "../constants/Address";

const oneEth = 1000000000000000000;

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

const content = "This transaction is not refundable. Are you sure you want to proceed?";

function Checkout() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { ticketId, concertId, concertName, concertLoc, category, ticketCost, concertDate } = state; // Read values passed on state

    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [openBackdrop, setOpenBackdrop] = React.useState(false);
    const handleOpenBackdrop = () => setOpenBackdrop(true);
    const handleCloseBackdrop = () => setOpenBackdrop(false);

    const [balance, setBalance] = useState('0');
    const [buyingCommission, setBuyingComission] = useState(0);

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

    // Function to request account connection
    const requestAccount = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                getBalance(provider, accounts[0]);
            } catch (error) {
                console.error(error);
            }
        } else {
            console.log('MetaMask is not installed');
        }
    };

    // Function to purchase
    const purchase = async () => {
        try {
            console.log("Ticket Cost: ")
            console.log(ticketCost);

            console.log("Buying Commission: ")
            console.log(buyingCommission);

            console.log("Total Cost: ")
            const totalCost = parseInt(buyingCommission) + parseInt(ticketCost);
            console.log(totalCost);

            console.log("Total Cost in Wei: ")
            const totalCostInWei = ethers.utils.parseUnits(totalCost.toFixed(), "wei");
            console.log(totalCostInWei);
            console.log(parseInt(totalCostInWei));

            console.log("Buy Result: ")
            await secondaryMarketplaceContract.buyTicket(ticketId, {
                value: totalCostInWei,
            });
            console.log("Success");

            // add timeout and refresh
            console.log("Reloading");
            handleOpenBackdrop();
            setTimeout(() => {
                navigate(-1);
            }, 16000);
        } catch (err) {
            console.log(err);
        }
    };
    
    const setBuyingComissionFunc = async () => {
        try {
            console.log("Buying Commission: ")
            const buyingCommissionVal = await secondaryMarketplaceContract.getBuyingCommission();
            setBuyingComission(buyingCommissionVal)
            console.log(buyingCommissionVal);
            console.log("Buying commission set successfully")
        } catch (err) {
            console.log(err);
        }
    }; 

    useEffect(() => {
        if (concertName.includes("Sheeran")) {
            setImage(edsheeran);
        } else if (concertName.includes("Taylor")) {
            setImage(swift);
        } else if (concertName.includes("Bruno")) {
            setImage(bruno);
        } else {
            setImage(concertpic);
        }
        setBuyingComissionFunc();
        requestAccount();
    }, []);

    // Assuming you have a data structure for the financials like this:
    const financials = {
        balanceEth: Number(balance) ,
        ticketCostWei: ticketCost,
        numberOfTickets: 1,
        commissionFeeWei: buyingCommission,
        currency: 'ETH'
    };

    // Perform calculations
    financials.totalCostOfTicketsWei = financials.ticketCostWei * financials.numberOfTickets;

    const [image, setImage] = useState('');

    return (
        <>
            <Header />
            <h2>Resale checkout with TicketID : {ticketId}</h2>
            <TicketPurchaseCard
                cardImg={image}
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
                <Button variant="contained" onClick={() => purchase()}>
                    Proceed
                </Button>
                <PurchaseAlertDialog open={open} handleClose={handleClose} content={content} />
            </>
            <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={openBackdrop} >
          <CircularProgress color="inherit" />
          &nbsp; &nbsp; Wait a moment...
        </Backdrop>
        </>
    );
}

export default Checkout;