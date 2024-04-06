import React, { useEffect, useState } from "react";
import NavBar from "./NavBar";
import Header from "./Header";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import Marketplace from "../contracts/Marketplace.json";
import { CONCERT, MARKETPLACE } from "../constants/Address";
import { STAGE } from "../constants/Enum";

import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/esm/Button";
import { useNavigate } from "react-router-dom";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);
const marketplaceContract = new ethers.Contract(
  MARKETPLACE,
  Marketplace.abi,
  signer
);

function MarketplacePage() {
  const [tableRows, setTableRows] = useState([]);
  const navigate = useNavigate();

  const fetchMarketplaceData = async () => {
    const result = await concertContract.getConcertsByStage(1);

    const transformedResult = result.map((concert) => {
      const res = [];
      res.push(parseInt(concert.id)); // ID
      res.push(concert.name); // Name
      res.push(concert.location); // Location
      res.push(parseInt(concert.concertDate)); // Concert Date
      res.push(STAGE[concert.stage]);

      return res;
    });

    setTableRows(transformedResult);
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const handleJoinQueue = async (id) => {
    try {
      await marketplaceContract.joinQueue(id);
      navigate(`/marketplace/${id}`);
    } catch (err) {
      alert("You are already in the queue");
    }
  };

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
              <td>
                <Button onClick={() => handleJoinQueue(row[0])}>
                  Join Queue
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default MarketplacePage;
