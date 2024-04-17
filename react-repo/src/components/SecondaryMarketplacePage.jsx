import React from "react";
import NavBar from "./NavBar";
import Header from "./Header";
import { DataGrid } from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import PurchaseAlertDialog from "./PurchaseAlertDialog";
import { useNavigate } from "react-router-dom";

import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { TextField } from "@mui/material";
import { useState } from "react";
import { useEffect } from "react";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import Ticket from "../contracts/Ticket.json";
import Marketplace from "../contracts/Marketplace.json";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";
import { CONCERT, TICKET, MARKETPLACE, SECONDARY_MARKETPLACE } from "../constants/Address";
import ListedTicketsModal from "./ListedTicketsModal";

const content = "Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);
const marketplaceContract = new ethers.Contract(MARKETPLACE, Marketplace.abi, signer);
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

function SecondaryMarketplacePage() {
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const columns = [
    { field: 'id', headerName: 'ID', flex: 1 },
    { field: 'concertName', headerName: 'Concert Name', flex: 1 },
    { field: 'concertId', headerName: 'Concert Id', flex: 1 },
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
                navigate('/checkout', {
                  state: {
                    rowId: cellValue.row.id,
                    concertId: cellValue.row.conertId,
                    concertName: cellValue.row.concertName,
                    concertLoc: cellValue.row.concertLoc,
                    category: cellValue.row.category,
                    ticketCost: cellValue.row.ticketCost,
                    concertDate: cellValue.row.concertDate
                  }
                });
              }
              }
            >
              Buy
            </Button>
          </>
        );
      }
    },
  ];

  const [tableRows, setTableRows] = useState([]);

  const fetchSecondaryMarketplaceListingsData = async () => {
    const rawListedTicketDetailsArr = await secondaryMarketplaceContract.getAllListedTicketDetailsArray();

    console.log("OJSFOJFS");
    const listedTicketDetailsArr = rawListedTicketDetailsArr.map((ticket) => {
      console.log(parseInt(ticket.ticketId));
      return {
        id: parseInt(ticket.ticketId),
        concertName: ticket.concertName,
        concertLoc: ticket.concertLocation,
        category: parseInt(ticket.category),
        ticketCost: parseInt(ticket.cost),
        concertDate: ticket.concertDate,
        listedBy: ticket.listedBy,
        buyButton: 1
      };
    });

    setTableRows(listedTicketDetailsArr);
  };

  const listTicketWithId = async (ticketId) => {
    const result = await secondaryMarketplaceContract.listTicket(ticketId, "S1234567A");
  };

  const unlistTicketWithId = async (ticketId) => {
    const result = await secondaryMarketplaceContract.unlistTicket(ticketId, "S1234567A");
  };

  useEffect(() => {
    fetchSecondaryMarketplaceListingsData();
  }, []);

  const [filterModel, setFilterModel] = React.useState({
    items: [
      {
        field: 'concertName',
        operator: 'contains',
        value: "",
      },
    ],
  });

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
        <Button
          variant="contained"
          onClick={() => {
            console.log("List My Ticket");
            listTicketWithId(1);
          }
          }
        >
          List my Ticket
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            console.log("Show My Listed Tickets");
            setOpen(true);
          }
          }
        >
          Show My Listed Tickets
        </Button>
        <Button variant="contained"
          onClick={() => {
            console.log("List My Ticket");
            unlistTicketWithId(1);
          }
          }
        >
          Unlist ticket id 1
        </Button>
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
        <ListedTicketsModal open={open} handleOpen={handleOpen} handleClose={handleClose} content={content} />
      </div>
    </>
  );
}

export default SecondaryMarketplacePage;
