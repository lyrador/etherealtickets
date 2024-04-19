import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "./NavBar";
import Header from "./Header";
import ListedTicketsModal from "./ListedTicketsModal";

import { DataGrid } from '@mui/x-data-grid';
import { Button, CircularProgress, Backdrop } from '@mui/material';

import { ethers } from "ethers";
import Ticket from "../contracts/Ticket.json";
import { ORGANIZER, TICKET } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);

function TicketsTab() {
    const navigate = useNavigate();

    const [currAccount, setCurrAccount] = React.useState('');

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [openBackdrop, setOpenBackdrop] = React.useState(false);
    const handleOpenBackdrop = () => setOpenBackdrop(true);
    const handleCloseBackdrop = () => setOpenBackdrop(false);

    const [isOwner, setIsOwner] = useState(false);

    const [tableRows, setTableRows] = useState([]);

    const columnsForOwner = [
        { field: 'id', headerName: 'ID', flex: 1 },
        { field: 'concertName', headerName: 'Concert Name', flex: 1 },
        { field: 'concertId', headerName: 'Concert Id', flex: 1 },
        { field: 'concertLoc', headerName: 'Concert Location', flex: 1 },
        { field: 'category', headerName: 'Category', width: 130 },
        { field: 'ticketCost', headerName: 'Ticket Cost (wei)', flex: 1 },
        { field: 'passportId', headerName: 'Passport ID', flex: 1 },
        { field: 'concertDate', headerName: 'Concert Date', type: 'string', flex: 1 },
        { field: 'seatNumber', headerName: 'Seat No.', flex: 1 },
        { field: 'validated', headerName: 'Validated', flex: 1 },
        {
            field: 'action', headerName: '', width: 250, disableClickEventBubbling: true,
            renderCell: (cellValue) => {
                const isValidated = (cellValue.row.validated == true);
                return (
                    <>
                        {!isValidated && (<Button
                            variant="contained"
                            onClick={() => {
                                console.log(cellValue.row.action);
                                validateAndCheckIn(cellValue.row.concertId, cellValue.row.id, cellValue.row.passportId);
                            }
                            }
                        >
                            Validate and Check-In
                        </Button>
                        )}
                    </>
                );
            }
        },
    ];

    const columnsForConcertgoer = [
        { field: 'id', headerName: 'ID', flex: 1 },
        { field: 'concertName', headerName: 'Concert Name', flex: 1 },
        { field: 'concertId', headerName: 'Concert Id', flex: 1 },
        { field: 'concertLoc', headerName: 'Concert Location', flex: 1 },
        { field: 'category', headerName: 'Category', width: 130 },
        { field: 'ticketCost', headerName: 'Ticket Cost (wei)', flex: 1 },
        { field: 'passportId', headerName: 'Passport ID', flex: 1 },
        { field: 'concertDate', headerName: 'Concert Date', type: 'string', flex: 1 },
        { field: 'seatNumber', headerName: 'Seat No.', flex: 1 },
        { field: 'validated', headerName: 'Validated', flex: 1 }
    ];

    const [columns, setColumns] = useState([]);

    const fetchTicketsData = async () => {
        let rawTicketDetailsArr;
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log(accounts[0]);

        if (accounts[0] == ORGANIZER) {
            rawTicketDetailsArr = await ticketContract.getAllTicketsForOpenConcerts();
            console.log(rawTicketDetailsArr);
            console.log("getAllTicketsForOpenConcerts");
            setColumns(columnsForOwner);
        } else {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log(accounts[0]);
            rawTicketDetailsArr = await ticketContract.getOwnedTickets(accounts[0]);
            console.log("getOwnedTicketDetailsArray");
            console.log(rawTicketDetailsArr);
            setColumns(columnsForConcertgoer);
        }

        const ticketDetailsArr = rawTicketDetailsArr.map((ticket) => {
            console.log(parseInt(ticket.ticketId));
            return {
                id: parseInt(ticket.ticketId),
                concertId: parseInt(ticket.concertId),
                concertName: ticket.concertName,
                concertLoc: ticket.concertLocation,
                category: parseInt(ticket.category),
                ticketCost: parseInt(ticket.cost),
                concertDate: parseInt(ticket.concertDate),
                seatNumber: parseInt(ticket.seatNumber),
                passportId: ticket.passportId,
                validated: ticket.validatedForUse,
                action: 1
            };
        });

        console.log(ticketDetailsArr);

        setTableRows(ticketDetailsArr);
    };

    const validateAndCheckIn = async (concertId, ticketId, passportId) => {
        try {
            console.log("Validate and Check-In")
            await ticketContract.stampTicketForConcert(concertId, ticketId, passportId);
            console.log("Success");

            // add timeout and refresh
            console.log("Reloading");
            handleOpenBackdrop();
            setTimeout(() => {
                window.location.reload(true);
            }, 16000);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAccountOnLoad();
        fetchTicketsData();
    }, []);

    window.ethereum.on('accountsChanged', function (accounts) {
        window.location.reload(true);
    })

    const getAccountOnLoad = async () => {
        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });
        setIsOwner(accounts[0] == ORGANIZER);
        setCurrAccount(accounts[0]);
    };

    return (
        <>
            <Header />
            <NavBar />
            {isOwner ? (
                <>
                    <h2>View Tickets for Open Concerts / Validate Ticket</h2>
                </>
            ) : (
                <>
                    <h2>View Owned Tickets</h2>
                </>
            )}
            <DataGrid
                rows={tableRows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10]}
                style={{minHeight: 200}}
            />
            <div style={{ height: 400, width: '100%' }}>
                <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={openBackdrop} >
                    <CircularProgress color="inherit" />
                    &nbsp; &nbsp; Wait a moment...
                </Backdrop>
            </div>
        </>
    );
}

export default TicketsTab;
