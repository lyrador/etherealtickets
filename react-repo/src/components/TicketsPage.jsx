import React from "react";
import { useState, useEffect } from "react";

import NavBar from "./NavBar";
import Header from "./Header";

import { DataGrid } from '@mui/x-data-grid';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, CircularProgress, Backdrop, Typography } from '@mui/material';

import { ethers } from "ethers";
import Ticket from "../contracts/Ticket.json";
import { TICKET, ORGANIZER } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);

function TicketsPage() {
  const [currAccount, setCurrAccount] = React.useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [currentPassportId, setCurrentPassportId] = useState('');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeConcertId, setActiveConcertId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const getAccountOnLoad = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const isOrg = accounts[0] == ORGANIZER;
        setCurrAccount(accounts[0]);
        setIsOwner(isOrg);
        if (isOrg) {
          fetchOpenTickets();
        } else {
          fetchOwnedTickets(accounts[0]);
        // setIsOwner(accounts[0] == ORGANIZER);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    getAccountOnLoad();
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      console.log("Please connect to MetaMask.");
    } else {
      const newAccount = accounts[0];
      setCurrAccount(newAccount);
      const isOrg = newAccount === ORGANIZER;
      if (isOrg) {
        fetchOpenTickets();
      } else {
        fetchOwnedTickets(newAccount);
      }
    }
  };

  const fetchOpenTickets = async () => {
    setLoading(true);
    try {
      const openTicketsArray = await ticketContract.getTicketsforOpenConcerts();
      const formattedOpenTickets = openTicketsArray.map((ticket) => ({
        id: ticket.ticketId.toString(),
        concertName: ticket.concertName,
        concertId: ticket.concertId.toString(),
        category: ticket.category.toString(),
        ticketCost: ethers.utils.formatEther(ticket.cost),
        concertDate: new Date(ticket.concertDate * 1000).toLocaleDateString(),
        seatNumber: ticket.seatNumber.toString(),
        validatedForUse: ticket.validatedForUse
      }));
      setTickets(formattedOpenTickets);
    } catch (error) {
      console.error("Failed to fetch open tickets:", error);
    }
    setLoading(false);
  };

  const fetchOwnedTickets = async (account) => {
    setLoading(true);
    try {
      const ticketsArray = await ticketContract.getOwnedTickets(account);
      const formattedTickets = ticketsArray.map(ticket => ({
        id: ticket.ticketId.toString(),
        concertName: ticket.concertName,
        concertId: ticket.concertId.toString(),
        category: ticket.category.toString(),
        ticketCost: ethers.utils.formatEther(ticket.cost),
        concertDate: new Date(ticket.concertDate * 1000).toLocaleDateString(),
        seatNumber: ticket.seatNumber.toString(),
        validatedForUse: ticket.validatedForUse
      }));
      setTickets(formattedTickets);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
    setLoading(false);
  };

  const openValidateDialog = (ticketId, concertId) => {
    setActiveTicketId(ticketId);
    setActiveConcertId(concertId);
    setOpenDialog(true);
  };

  const validateTicket = async () => {
    if (!isOwner || !activeTicketId || !activeConcertId) {
      console.log("Not authorized to validate tickets.");
      return;
    }
    setError('');
    try {
      const transaction = await ticketContract.useTicketForConcert(activeConcertId, activeTicketId, currentPassportId);
      await transaction.wait();
      console.log(`Ticket ${activeTicketId} validated`);
      fetchOpenTickets();
      setOpenDialog(false); // Close the dialog on success
      setCurrentPassportId(''); // Reset passport ID
    } catch (error) {
      console.error(`Failed to validate ticket ${activeTicketId}:`, error);
      setError('Failed to validate the ticket. Please check the passport ID.');
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', flex: 1  },
    { field: 'concertName', headerName: 'Concert Name', flex: 1 },
    { field: 'concertId', headerName: 'Concert Id', flex: 1 },
    { field: 'concertLoc', headerName: 'Concert Location', flex: 1 },
    { field: 'category', headerName: 'Category', width: 130 },
    { field: 'ticketCost', headerName: 'Ticket Cost (ETH)', flex: 1},
    { field: 'listedBy', headerName: 'Listed By', flex: 1 },
    { field: 'concertDate', headerName: 'Concert Date', type: 'string', flex: 1 },
    { field: 'seatNumber', headerName: 'Seat No.', flex: 1 },
    { field: 'validatedForUse', headerName: 'Validated', width: 120 },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => (
        isOwner && !params.row.validatedForUse ? (
          <Button variant="contained" onClick={() => openValidateDialog(params.row.id, params.row.concertId)}>
            Validate
          </Button>
        ) : (
          <span>N/A</span>
        )
      )
    }
  ];

  return (
    <>
      <Header />
      <NavBar />
      <h2>{isOwner ? "Tickets for Open Concerts" : "My Tickets"}</h2>
      <div style={{ height: 400, width: '100%' }}>
        {loading ? (
          <Backdrop open={true} style={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        ) : (
          <DataGrid
            rows={tickets}
            columns={columns}
            pageSize={5}
            checkboxSelection={false}
          />
        )}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Validate Ticket</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="passportId"
              label="Passport ID"
              type="text"
              fullWidth
              variant="outlined"
              value={currentPassportId}
              onChange={(e) => setCurrentPassportId(e.target.value)}
            />
            {error && <Typography color="error">{error}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={validateTicket} color="primary">
              Validate
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}

export default TicketsPage;
