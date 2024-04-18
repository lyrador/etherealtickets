import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "./NavBar";
import Header from "./Header";
import ListedTicketsModal from "./ListedTicketsModal";

import { DataGrid } from '@mui/x-data-grid';
import { Button, InputAdornment, TextField, CircularProgress, Backdrop } from '@mui/material';
import PurchaseAlertDialog from "./PurchaseAlertDialog";

import SearchIcon from '@mui/icons-material/Search';

import { ethers } from "ethers";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";
import { SECONDARY_MARKETPLACE } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

function SecondaryMarketplacePage() {
  const navigate = useNavigate();

  const [currAccount, setCurrAccount] = React.useState('');

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [openBackdrop, setOpenBackdrop] = React.useState(false);
  const handleOpenBackdrop = () => setOpenBackdrop(true);
  const handleCloseBackdrop = () => setOpenBackdrop(false);

  const [filterModel, setFilterModel] = React.useState({
    items: [
      { field: 'concertName', operator: 'contains', value: "" },
    ],
  });

  const [tableRows, setTableRows] = useState([]);

  const columns = [
    { field: 'id', headerName: 'ID', flex: 1 },
    { field: 'concertName', headerName: 'Concert Name', flex: 1 },
    { field: 'concertId', headerName: 'Concert Id', flex: 1 },
    { field: 'concertLoc', headerName: 'Concert Location', flex: 1 },
    { field: 'category', headerName: 'Category', width: 130 },
    { field: 'ticketCost', headerName: 'Ticket Cost (in ETH)', flex: 1 },
    { field: 'listedBy', headerName: 'Listed By', flex: 1 },
    { field: 'concertDate', headerName: 'Concert Date', type: 'string', flex: 1 },
    {
      field: 'buyButton', headerName: '', width: 150, disableClickEventBubbling: true,
      renderCell: (cellValue) => {
        let cellListedByString = cellValue.row.listedBy.toString().toUpperCase();
        let currAccountString = currAccount.toString().toUpperCase();
        const isNotListedByMe = (cellListedByString != currAccountString);
        return (
          <>
            {isNotListedByMe && (<Button
              variant="contained"
              onClick={() => {
                console.log(cellValue.row.buyButton);
                navigate('/checkout', {
                  state: {
                    ticketId: cellValue.row.id,
                    concertId: cellValue.row.concertId,
                    concertName: cellValue.row.concertName,
                    concertLoc: cellValue.row.concertLoc,
                    category: cellValue.row.category,
                    ticketCost: parseInt(cellValue.row.ticketCost),
                    concertDate: cellValue.row.concertDate
                  }
                });
              }
              }
            >
              Buy
            </Button>
            )
            }
          </>
        );
      }
    },
  ];

  const fetchSecondaryMarketplaceListingsData = async () => {
    const rawListedTicketDetailsArr = await secondaryMarketplaceContract.getAllListedTicketDetailsArray();
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCurrAccount(accounts[0]);
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('MetaMask is not installed');
    }
    console.log("getAllListedTicketDetailsArray");
    const listedTicketDetailsArr = rawListedTicketDetailsArr.map((ticket) => {
      console.log(parseInt(ticket.ticketId));
      return {
        id: parseInt(ticket.ticketId),
        concertName: ticket.concertName,
        concertId: parseInt(ticket.concertId),
        concertLoc: ticket.concertLocation,
        category: parseInt(ticket.category),
        ticketCost: parseInt(ticket.cost),
        concertDate: parseInt(ticket.concertDate),
        listedBy: ticket.listedBy,
        buyButton: 1
      };
    });

    setTableRows(listedTicketDetailsArr);
  };

  useEffect(() => {
    fetchSecondaryMarketplaceListingsData();
  }, []);

  window.ethereum.on('accountsChanged', function (accounts) {
    window.location.reload(true);
  })

  return (
    <>
      <Header />
      <NavBar />
      <h2>Secondary Marketplace</h2>
      <div style={{ height: 400, width: '100%' }}>
        <TextField
          placeholder="Search for concert..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onChange={(e) => setFilterModel({
            items: [
              {
                field: 'concertName',
                operator: 'contains',
                value: e.target.value,
              },
            ],
          })}
          style={{ width: 500, margin: 10 }}
        />
        <Button variant='contained' onClick={handleOpen} style={{ marginTop: 20, marginRight: 30, float: "right" }}>
          List / Unlist My Tickets
        </Button>
        <ListedTicketsModal open={open} handleOpen={handleOpen} handleClose={handleClose}
          handleOpenBackdrop={handleOpenBackdrop} />
        <DataGrid
          rows={tableRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10]}
          //checkboxSelection
          filterModel={filterModel}
          onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
        />
        <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={openBackdrop} >
          <CircularProgress color="inherit" />
          &nbsp; &nbsp; Wait a moment...
        </Backdrop>
      </div>
    </>
  );
}

export default SecondaryMarketplacePage;
