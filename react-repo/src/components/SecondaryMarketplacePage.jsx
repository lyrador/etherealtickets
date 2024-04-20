import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NavBar from "./NavBar";
import Header from "./Header";
import ListedTicketsModal from "./ListedTicketsModal";
import SnackbarAlert from "./SnackbarAlert";

import { DataGrid } from '@mui/x-data-grid';
import { Button, InputAdornment, TextField, CircularProgress, Backdrop } from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { ethers } from "ethers";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";
import { SECONDARY_MARKETPLACE, ORGANIZER } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

function SecondaryMarketplacePage() {
  const navigate = useNavigate();

  const [currAccount, setCurrAccount] = React.useState('');
  const [secondaryMarketBalance, setSecondaryMarketBalance] = React.useState('');

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [openBackdrop, setOpenBackdrop] = React.useState(false);
  const handleOpenBackdrop = () => setOpenBackdrop(true);
  const handleCloseBackdrop = () => setOpenBackdrop(false);

  const [openAlert, setOpenAlert] = React.useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");
  const handleOpenAlert = (type, message) => {
    setAlertMessage(message);
    setAlertType(type);
    setOpenAlert(true);
  }
  const handleCloseAlert = () => setOpenAlert(false);

  const [isOwner, setIsOwner] = useState(false);

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
    { field: 'seatNumber', headerName: 'Seat No.', flex: 1 },
    {
      field: 'buyButton', headerName: '', width: 150, disableClickEventBubbling: true,
      renderCell: (cellValue) => {
        let cellListedByString = cellValue.row.listedBy.toString().toUpperCase();
        let currAccountString = currAccount.toString().toUpperCase();
        const isNotListedByMe = (cellListedByString != currAccountString);
        return (
          <>
            {isNotListedByMe && !isOwner && (<Button
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
                    concertDate: cellValue.row.concertDate,
                    seatNumber: cellValue.row.seatNumber
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
      const ticketStruct = ticket.ticket;
      console.log(parseInt(ticket.ticketId));
      return {
        id: parseInt(ticketStruct.ticketId),
        concertName: ticketStruct.concertName,
        concertId: parseInt(ticketStruct.concertId),
        concertLoc: ticketStruct.concertLocation,
        category: parseInt(ticketStruct.category),
        ticketCost: parseInt(ticketStruct.cost),
        concertDate: parseInt(ticketStruct.concertDate),
        listedBy: ticket.listedBy,
        seatNumber: parseInt(ticketStruct.seatNumber),
        buyButton: 1
      };
    });

    setTableRows(listedTicketDetailsArr);
  };

  useEffect(() => {
    getAccountOnLoad();
    fetchSecondaryMarketplaceListingsData();
  }, []);

  window.ethereum.on('accountsChanged', function (accounts) {
    window.location.reload(true);
  })

  const getAccountOnLoad = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setIsOwner(accounts[0] == ORGANIZER);
    if (accounts[0] == ORGANIZER) {
      const balance = await secondaryMarketplaceContract.getBalance();
      setSecondaryMarketBalance(balance);
    }
  };

  // Function to purchase
  const withdrawBalance = async () => {
    try {
      handleOpenBackdrop();
      console.log("Withdraw Balance: ")
      const transaction = await secondaryMarketplaceContract.withdrawAll();
      const receipt = await transaction.wait();

      console.log("Success");
      console.log(transaction);

      handleOpenAlert("success", `Success! Transaction Hash: ${transaction.hash}`);

      setSecondaryMarketBalance(0);
    } catch (err) {
      console.log(err);
    }
    handleCloseBackdrop();
  };

  return (
    <>
      <Header />
      <NavBar />
      <div style={{ margin: '2% 3% 3% 3%' }}>
        <div style={{ width: '100%' }}>
          <h2>Secondary Marketplace</h2>
          {isOwner && (<div style={{}}>
            <h5 style={{ float: 'left' }}>
              Balance in Secondary Marketplace: {`${secondaryMarketBalance}`} wei
            </h5>
            {secondaryMarketBalance == 0 ? (
              <Button variant='contained' disabled style={{ marginRight: 30, float: "right" }}>
                Withdraw balance
              </Button>
            ) : (
              <Button variant='contained' onClick={withdrawBalance} style={{ marginRight: 30, float: "right" }}>
                Withdraw balance
              </Button>
            )
            }
          </div>)}
        </div>
        <br></br>
        <br></br>
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
          {!isOwner && (<Button variant='contained' onClick={handleOpen} style={{ marginTop: 20, marginRight: 30, float: "right" }}>
            List / Unlist My Tickets
          </Button>)}
          <ListedTicketsModal open={open} handleOpen={handleOpen} handleClose={handleClose}
            handleOpenBackdrop={handleOpenBackdrop} handleCloseBackdrop={handleCloseBackdrop}
            handleOpenAlert={handleOpenAlert} handleCloseAlert={handleCloseAlert} setListingsTableRows={setTableRows} />
          <DataGrid
            rows={tableRows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
            pageSizeOptions={[5, 10]}
            filterModel={filterModel}
            onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
          />
        </div>
        <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={openBackdrop} >
          <CircularProgress color="inherit" />
          &nbsp; &nbsp; Wait a moment...
        </Backdrop>
        <SnackbarAlert openAlert={openAlert} handleCloseAlert={handleCloseAlert} alertType={alertType} alertMessage={alertMessage} />
      </div>
    </>
  );
}

export default SecondaryMarketplacePage;
