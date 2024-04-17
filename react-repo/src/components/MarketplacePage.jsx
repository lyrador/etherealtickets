import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import Header from "./Header";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import Marketplace from "../contracts/Marketplace.json";
import { CONCERT, MARKETPLACE, SECONDARY_MARKETPLACE, ORGANIZER } from "../constants/Address";
import { STAGE } from "../constants/Enum";

import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/esm/Button";
import { useNavigate } from "react-router-dom";
import SecondaryMarketplace from "../contracts/SecondaryMarketplace.json";

import { TextField } from "@mui/material";

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
    try {
      const concertNum = parseInt(concertToAdvance);
      await concertContract.updateConcertStage(concertNum);
      const updatedStage = await concertContract.getConcertStage(concertNum);
      console.log(updatedStage);
      if (updatedStage == 2) {
        await secondaryMarketplaceContract.createSecondaryMarketplace(concertNum);
      }
      console.log(`Moved Concert ${concertToAdvance} to Next Stage`);
    } catch (err) {
      console.log(err);
    }
  }
  
  const getAccountOnLoad = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setIsOwner(accounts[0] == ORGANIZER);
  };

  const handleAccountsChanged = (accounts) => {
    setIsOwner(accounts[0] == ORGANIZER);
  };

  useEffect(() => {
    fetchMarketplaceData();
    getAccountOnLoad();

    // Subscribe to Metamask account changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
  }, []);

  const handleJoinQueue = async (id) => {
    try {
      await marketplaceContract.joinQueue(id);
      navigate(`/marketplace/${id}`);
    } catch (err) {
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
    </>
  );
}

export default MarketplacePage;
