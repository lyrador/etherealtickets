import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";
import { useState } from "react";
import { useEffect } from "react";
import { DataGrid } from '@mui/x-data-grid';
import { ethers } from "ethers";
import { CONCERT, TICKET, MARKETPLACE, SECONDARY_MARKETPLACE } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function BasicModal({ open, handleOpen, handleClose, content }) {

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
            field: 'listButton', headerName: '', width: 150, disableClickEventBubbling: true,
            renderCell: (cellValue) => {
                return (
                    <>
                        <Button
                            variant="contained"
                            onClick={() => {
                                console.log(cellValue.row.id);
                                listTicketWithId(cellValue.row.id);
                            }
                            }
                        >
                            List
                        </Button>
                    </>
                );
            }
        },
    ];

    const [tableRows, setTableRows] = useState([]);

    const listTicketWithId = async (ticketId) => {
        const result = await secondaryMarketplaceContract.listTicket(ticketId, "S1234567A");
    };

    const unlistTicketWithId = async (ticketId) => {
        const result = await secondaryMarketplaceContract.unlistTicket(ticketId, "S1234567A");
    };

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

    useEffect(() => {
        fetchSecondaryMarketplaceListingsData();
    }, []);

    return (
        <div>
            <Button onClick={handleOpen}>Open modal</Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Text in a modal
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                    </Typography>
                    <DataGrid
                        rows={tableRows}
                        columns={columns}
                        initialState={{
                            pagination: {
                                paginationModel: { page: 0, pageSize: 5 },
                            },
                        }}
                        pageSizeOptions={[5, 10]}
                    />
                </Box>
            </Modal>
        </div>
    );
}