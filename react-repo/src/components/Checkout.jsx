import React from "react";
import NavBar from "./NavBar";
import Header from "./Header";
import { DataGrid } from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
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

const content = "Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.";

function Checkout() {
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);
    const { state } = useLocation();
    const { id } = state; // Read values passed on state


    const [balance, setBalance] = useState('0');

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

    useEffect(() => {
        requestAccount();
    }, []);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const columns = [
        { field: 'id', headerName: 'ID', flex: 1 },
        { field: 'concertName', headerName: 'Concert Name', flex: 1 },
        { field: 'concertLoc', headerName: 'Concert Location', flex: 1 },
        { field: 'category', headerName: 'Category', width: 130 },
        { field: 'ticketCost', headerName: 'Ticket Cost (in ETH)', flex: 1 },
        { field: 'listedBy', headerName: 'Listed By', flex: 1 },
        {
            field: 'concertDate',
            headerName: 'Concert Date',
            type: 'string',
            flex: 1,
        },
        {
            field: 'buyButton', headerName: '', width: 150, disableClickEventBubbling: true,
            renderCell: (cellValue) => {
                return (
                    <>
                        <Button
                            variant="contained"
                            onClick={() => {
                                console.log(cellValue.row.buyButton);
                                handleClickOpen();
                            }
                            }
                        >
                            Buy
                        </Button>
                        <PurchaseAlertDialog open={open} handleClose={handleClose} content={content} />
                    </>
                );
            }
        },
    ];

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
            <h2>Checkout with ticketId : {id}</h2>
            <h3>{balance}</h3>
            <TicketPurchaseCard cardImg={swift} />
            <div>
                <FinancialTable data={financials} />
            </div>
            <Button variant="contained" color="error" onClick={() => navigate(-1)}>Cancel checkout and return</Button>
        </>
    );
}

export default Checkout;