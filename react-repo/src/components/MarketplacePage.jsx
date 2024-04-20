import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Header from "./Header";
import SnackbarAlert from "./SnackbarAlert";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import Marketplace from "../contracts/Marketplace.json";
import { CONCERT, MARKETPLACE, SECONDARY_MARKETPLACE, ORGANIZER } from "../constants/Address";
import { STAGE } from "../constants/Enum";

import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/esm/Button";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";

import { TextField, CircularProgress, Backdrop } from "@mui/material";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);
const marketplaceContract = new ethers.Contract(
  MARKETPLACE,
  Marketplace.abi,
  signer
);
const secondaryMarketplaceContract = new ethers.Contract(SECONDARY_MARKETPLACE, SecondaryMarketplace.abi, signer);

function MarketplacePage() {
  const [tableRows, setTableRows] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();

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

  const fetchMarketplaceData = async () => {
    const primarySaleConcerts = await concertContract.getConcertsByStage(1);
    const secondarySaleConcerts = await concertContract.getConcertsByStage(2);
    const concerts = [...primarySaleConcerts, ...secondarySaleConcerts];

    const transformedResult = concerts.map((concert) => {
      const res = [];
      res.push(parseInt(concert.id)); // ID
      res.push(concert.name); // Name
      res.push(concert.location); // Location
      res.push(parseInt(concert.concertDate)); // Concert Date
      res.push(STAGE[concert.stage]);
      console.log(res);
      return res;
    });

    setTableRows(transformedResult);
  };

  const moveConcertToNextStage = async () => {
    handleOpenBackdrop();
    try {
      const concertNum = parseInt(concertToAdvance);
      const transaction1 = await concertContract.updateConcertStage(concertNum);
      const receipt1 = await transaction1.wait();
      if (concertNum == 1) {
        const transaction2 = await secondaryMarketplaceContract.createSecondaryMarketplace(concertNum);
        const receipt2 = await transaction2.wait();
      }
      console.log(transaction1);
      console.log(receipt1);

      handleOpenAlert("success", `Success! Transaction Hash: ${transaction1.hash}`);

      fetchMarketplaceData();
      console.log(`Moved Concert ${concertToAdvance} to Next Stage`);
    } catch (err) {
      console.log(err);
    }
    handleCloseBackdrop();
  }

  const getAccountOnLoad = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setIsOwner(accounts[0] == ORGANIZER);
  };

  const handleAccountsChanged = (accounts) => {
    window.location.reload();
    setIsOwner(accounts[0] == ORGANIZER);
  };

  useEffect(() => {
    fetchMarketplaceData();
    getAccountOnLoad();

    // Subscribe to Metamask account changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
  }, []);

  const handleJoinQueue = async (id) => {
    handleOpenBackdrop();
    try {
      const transaction = await marketplaceContract.joinQueue(id);
      const receipt = await transaction.wait();
      handleOpenAlert("success", `Success! Transaction Hash: ${transaction.hash}`);
      handleCloseBackdrop();
      navigate(`/marketplace/${id}`);
    } catch (err) {
      handleCloseBackdrop();
      alert("You are already in the queue");
    }
  };

  // for organizer
  const viewMarketplace = (id) => {
    navigate(`/marketplace/${id}`);
  };

  const [concertToAdvance, setConcertToAdvance] = React.useState(0);

  return (
    <>
      <Header />
      <NavBar />
      <div style={{ margin: '2% 3% 3% 3%' }}>
        <h2>Marketplace</h2>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
              <th>Concert Date</th>
              <th>Stage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr>
                {row.map((col) => (
                  <td>{col}</td>
                ))}
                {isOwner ? (
                  <td>
                    <Button onClick={() => viewMarketplace(row[0])}>
                      View Marketplace
                    </Button>
                  </td>
                ) : (
                  <td>
                    <Button onClick={() => handleJoinQueue(row[0])}>
                      Join Queue
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        {isOwner && <>
          <TextField
            placeholder="ConcertID to Go Next Stage"
            onChange={(e) => setConcertToAdvance(e.target.value)}
            style={{ width: 250, margin: 10 }}
          />
          <Button onClick={() => moveConcertToNextStage()} style={{ margin: 20 }}>
            Move to next stage
          </Button>
        </>
        }
      </div>
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={openBackdrop} >
        <CircularProgress color="inherit" />
        &nbsp; &nbsp; Wait a moment...
      </Backdrop>
      <SnackbarAlert openAlert={openAlert} handleCloseAlert={handleCloseAlert} alertType={alertType} alertMessage={alertMessage} />
    </>
  );
}

export default MarketplacePage;
