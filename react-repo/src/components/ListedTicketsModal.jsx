import * as React from 'react';
import { Box, Button, Typography, Modal, CircularProgress, Backdrop } from '@mui/material';
import { useState, useEffect } from "react";
import { DataGrid } from '@mui/x-data-grid';

import { ethers } from "ethers";

import { CONCERT, TICKET, MARKETPLACE, SECONDARY_MARKETPLACE } from "../constants/Address";
import Ticket from "../contracts/Ticket.json";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '85%',
    height: '70%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function BasicModal({ open, handleOpen, handleClose, handleOpenBackdrop, handleCloseBackdrop, handleOpenAlert, handleCloseAlert, setListingsTableRows }) {

    const columns = [
        { field: 'id', headerName: 'ID', flex: 1 },
        { field: 'concertId', headerName: 'Concert Id', flex: 1 },
        { field: 'concertName', headerName: 'Concert Name', flex: 1 },
        { field: 'concertLoc', headerName: 'Concert Location', flex: 1 },
        { field: 'category', headerName: 'Category', width: 130 },
        { field: 'ticketCost', headerName: 'Ticket Cost (in ETH)', flex: 1 },
        { field: 'concertDate', headerName: 'Concert Date', type: 'string', flex: 1 },
        { field: 'seatNumber', headerName: 'Seat No.', flex: 1 },
        {
            field: 'listButton', headerName: '', width: 150, disableClickEventBubbling: true,
            renderCell: (cellValue) => {
                const listedBool = cellValue.row.isListed;
                console.log("ListedBool");
                console.log(listedBool);
                return (
                    <>
                        {listedBool ? (<Button variant="contained"
                            onClick={() => {
                                console.log(cellValue.row.id);
                                unlistTicketWithId(cellValue.row.id);
                            }
                            }
                        >
                            Unlist
                        </Button>
                        ) : (<Button variant="contained"
                            onClick={() => {
                                console.log(cellValue.row.id);
                                listTicketWithId(cellValue.row.id);
                            }
                            }
                        >
                            List
                        </Button>

                        )
                        }
                    </>
                );
            }
        },
    ];

    const [tableRows, setTableRows] = useState([]);

    const listTicketWithId = async (ticketId) => {
        handleOpenBackdrop();
        try {
            console.log("List ticket: ")
            const transaction = await secondaryMarketplaceContract.listTicket(ticketId);
            const receipt = transaction.wait();
            console.log("Success");
            console.log("Reloading");

            console.log(transaction);
            console.log(receipt);

            handleOpenAlert("success", `Success! Transaction Hash: ${transaction.hash}`);

            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (err) {
            console.log(err);
            handleClose();
            handleCloseBackdrop();
        }
    };

    const unlistTicketWithId = async (ticketId) => {
        handleOpenBackdrop();
        try {
            console.log("Unlist ticket: ")
            const transaction = await secondaryMarketplaceContract.unlistTicket(ticketId);
            const receipt = transaction.wait();
            console.log("Success");
            handleOpenAlert("success", `Success! Transaction Hash: ${transaction.hash}`);
            console.log("Reloading");

            console.log(transaction);
            console.log(receipt);

            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (err) {
            console.log(err);
            handleClose();
            handleCloseBackdrop();
        }
    };

    const fetchOwnedTicketsInSecondarySaleStageData = async () => {
        const rawOwnedTicketDetailsArr = await secondaryMarketplaceContract.getOwnedTicketDetailsArray();

        console.log("fetchOwnedTicketsData");
        console.log(rawOwnedTicketDetailsArr);
        const ownedTicketDetailsArr = rawOwnedTicketDetailsArr.map((ticket) => {
            const ticketStruct = ticket.ticket;
            console.log(parseInt(ticketStruct.ticketId));
            return {
                id: parseInt(ticketStruct.ticketId),
                concertId: parseInt(ticketStruct.concertId),
                concertName: ticketStruct.concertName,
                concertLoc: ticketStruct.concertLocation,
                category: parseInt(ticketStruct.category),
                ticketCost: parseInt(ticketStruct.cost),
                concertDate: parseInt(ticketStruct.concertDate),
                isListed: ticket.isListed,
                isSecondarySaleStage: ticket.concertStage == 2,
                seatNumber: parseInt(ticketStruct.seatNumber),
                buyButton: 1
            };
        });

        console.log(ownedTicketDetailsArr);

        const ownedTicketDetailsSecondaryStageArr = ownedTicketDetailsArr.filter((ticket) => ticket.isSecondarySaleStage == true);

        setTableRows(ownedTicketDetailsSecondaryStageArr);
    };

    const fetchSecondaryMarketplaceListingsData = async () => {
        const rawListedTicketDetailsArr = await secondaryMarketplaceContract.getAllListedTicketDetailsArray();
        //console.log("getAllListedTicketDetailsArray");
        const listedTicketDetailsArr = rawListedTicketDetailsArr.map((ticket) => {
          const ticketStruct = ticket.ticket;
          //console.log(parseInt(ticket.ticketId));
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
    
        setListingsTableRows(listedTicketDetailsArr);
      };

    useEffect(() => {
        fetchOwnedTicketsInSecondarySaleStageData();
    }, []);

    return (
        <div>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        My Tickets
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        These are my tickets available for listing or unlisting on secondary marketplace...
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
                        style={{ height: '80%' }}
                    />
                </Box>
            </Modal>
        </div>
    );
}