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

const content = "Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.";

function SecondaryMarketplace() {
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);

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
                //handleClickOpen();
                navigate('/checkout', { state: { id: cellValue.row.buyButton } });
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

  const rows = [
    { id: 1, concertName: 'Taylor Swift Eras Day 1', concertLoc: 'Singapore National Stadium', category: 1, ticketCost: 0.2, concertDate: 100324, listedBy: 'Adam', 'buyButton': 1 },
    { id: 2, concertName: 'Taylor Swift Eras Day 4', concertLoc: 'Singapore National Stadium', category: 2, ticketCost: 0.1, concertDate: 110324, listedBy: 'Bob', 'buyButton': 2 },
    { id: 3, concertName: 'Bruno Mars 24K Magic Day 2', concertLoc: 'Singapore Indoor Stadium', category: 3, ticketCost: 0.08, concertDate: 120424, listedBy: 'Carl', 'buyButton': 3 },
  ];

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
          style={{width: 500, margin: 10}}
        />
        <DataGrid
          rows={rows}
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
      </div>
    </>
  );
}

export default SecondaryMarketplace;
