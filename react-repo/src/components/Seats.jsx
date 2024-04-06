import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import Marketplace from "../contracts/Marketplace.json";
import { CONCERT, MARKETPLACE } from "../constants/Address";

import Button from "react-bootstrap/esm/Button";
import Form from "react-bootstrap/Form";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);
const marketplaceContract = new ethers.Contract(
  MARKETPLACE,
  Marketplace.abi,
  signer
);

const SEATS_PER_ROW = 10;

const getTotalSeats = (seats) => {
  let sum = 0;
  for (let i = 0; i < seats.length; i++) {
    sum += seats[i];
  }
  return sum;
};

const getTotalCost = (seats) => {
  let totalCostInWei = ethers.constants.Zero;

  seats.forEach((seat) => {
    // Convert seat cost from ether format to wei
    const seatCostInWei = ethers.utils.parseEther(seat.cost);

    // Add seat cost to total cost
    totalCostInWei = totalCostInWei.add(seatCostInWei);
  });

  return totalCostInWei;
};

function Seats() {
  const location = useLocation();
  const navigate = useNavigate();
  const concertId = location.pathname.split("/")[2];
  const [queuePosition, setQueuePosition] = useState(0);
  const [rows, setRows] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatAddresses, setSeatAddresses] = useState([]);

  const fetchQueueData = async () => {
    const result = await marketplaceContract.getQueuePosition(concertId);
    setQueuePosition(parseInt(result));
  };

  const fetchSeatsData = async () => {
    const result = await concertContract.getCategorySeatArray(concertId);
    const totalSeats = getTotalSeats(result);
    setRows(totalSeats / SEATS_PER_ROW);

    const addresses = [];
    for (let i = 1; i <= totalSeats; i++) {
      const address = await marketplaceContract.getSeatAddress(concertId, i);
      addresses.push(address);
    }
    setSeatAddresses(addresses);
  };

  useEffect(() => {
    fetchQueueData();
    fetchSeatsData();
  }, []);

  const handleSelectSeat = async (seatNum) => {
    const seatCost = await concertContract.getSeatCost(concertId, seatNum);
    const seatCategory = await concertContract.getSeatCategory(
      concertId,
      seatNum
    );

    const seatObj = {};
    seatObj["seatNum"] = seatNum;
    seatObj["cost"] = ethers.utils.formatEther(seatCost);
    seatObj["category"] = seatCategory + 1;
    setSelectedSeats([...selectedSeats, seatObj]);
  };

  const handleBuyTicket = async (e) => {
    e.preventDefault();

    const seatNums = selectedSeats.map((seat) => seat.seatNum);
    const passportIds = selectedSeats.map((seat, idx) => {
      const inputName = `passport${idx + 1}`;
      return e.target.elements[inputName].value;
    });
    const amtToPay = getTotalCost(selectedSeats);

    console.log(seatNums);
    console.log(passportIds);
    console.log(amtToPay);

    try {
      await marketplaceContract.buyTicket(concertId, seatNums, passportIds, {
        value: amtToPay,
      });
      navigate("/marketplace");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <h1>You are {queuePosition} in Queue</h1>
      {queuePosition === 1 && (
        <div style={{ display: "flex", height: "80vh" }}>
          <div className="column">
            <h2 style={{ textAlign: "center", margin: 50 }}>Stage</h2>
            {Array(rows)
              .fill(1)
              .map((row, rowIdx) => (
                <div>
                  {" "}
                  {Array(SEATS_PER_ROW)
                    .fill(1)
                    .map((seat, seatIdx) => {
                      const seatNum = rowIdx * 10 + seatIdx + 1;
                      if (
                        seatAddresses[seatNum - 1] ==
                        "0x0000000000000000000000000000000000000000"
                      ) {
                        return (
                          <Button
                            style={{ width: 70, margin: 10 }}
                            onClick={() => handleSelectSeat(seatNum)}
                          >
                            {seatNum}
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            variant="secondary"
                            disabled
                            style={{ width: 70, margin: 10 }}
                          >
                            {seatNum}
                          </Button>
                        );
                      }
                    })}
                </div>
              ))}
          </div>
          <div className="column">
            <h2 style={{ textAlign: "center", margin: 50 }}>Seat Selection</h2>
            <Form onSubmit={handleBuyTicket}>
              {selectedSeats.map((seat, idx) => (
                <Form.Group className="m-5">
                  <h4>Seat No: {seat.seatNum}</h4>
                  <h4>Category: {seat.category}</h4>
                  <h4>Amount: {seat.cost} ETH</h4>
                  <Form.Control
                    name={`passport${idx + 1}`}
                    placeholder="Enter your passport ID"
                  />
                </Form.Group>
              ))}
              <Button style={{ marginLeft: 45 }} type="submit">
                Buy Tickets
              </Button>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}

export default Seats;
