import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SnackbarAlert from "./SnackbarAlert";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import Marketplace from "../contracts/Marketplace.json";
import Ticket from "../contracts/Ticket.json";
import { CONCERT, MARKETPLACE, ORGANIZER, TICKET, SECONDARY_MARKETPLACE } from "../constants/Address";
import { CATEGORY_COLOR } from "../constants/Enum";

import Button from "react-bootstrap/esm/Button";
import Form from "react-bootstrap/Form";
import { CircularProgress, Backdrop } from "@mui/material";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const concertContract = new ethers.Contract(CONCERT, Concert.abi, signer);
const marketplaceContract = new ethers.Contract(
  MARKETPLACE,
  Marketplace.abi,
  signer
);
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);

const SEATS_PER_ROW = 10;

const getTotalSeats = (seats) => {
  let sum = 0;
  for (let i = 0; i < seats.length; i++) {
    console.log("Loop - getTotalSeats for category: " + i);
    console.log(typeof seats[i]);
    console.log(parseInt(seats[i]));
    sum += parseInt(seats[i]);
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
  const [seatCategories, setSeatCategories] = useState([]);
  const [isOwner, setIsOwner] = useState(false);

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

  const fetchQueueData = async () => {
    const result = await marketplaceContract.getQueuePosition(concertId);
    setQueuePosition(parseInt(result));
  };

  const fetchSeatsData = async () => {
    const result = await concertContract.getCategorySeatArray(concertId);
    const totalSeats = getTotalSeats(result);
    console.log("Fetch seats data");
    console.log(totalSeats);
    setRows(totalSeats / SEATS_PER_ROW);

    const addresses = [];
    for (let i = 1; i <= totalSeats; i++) {
      const address = await marketplaceContract.getSeatAddress(concertId, i);
      addresses.push(address);
    }
    setSeatAddresses(addresses);

    const categories = [];
    for (let i = 1; i <= totalSeats; i++) {
      const category = await concertContract.getSeatCategory(concertId, i);
      categories.push(CATEGORY_COLOR[category]);
    }
    console.log(categories);
    setSeatCategories(categories);
  };

  const getAccountOnLoad = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setIsOwner(accounts[0] == ORGANIZER);
  };

  useEffect(() => {
    fetchQueueData();
    fetchSeatsData();
    getAccountOnLoad();
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
    seatObj["category"] = parseInt(seatCategory);
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

    handleOpenBackdrop();
    try {
      const transaction1 = await marketplaceContract.buyTicket(concertId, seatNums, passportIds, {
        value: amtToPay,
      });
      const receipt1 = await transaction1.wait();
      const transaction2 = await ticketContract.setApprovalForAll(SECONDARY_MARKETPLACE, true);
      const receipt2 = await transaction2.wait();
      handleOpenAlert("success", `Success! Transaction Hash: ${transaction1.hash}`);
      setTimeout(() => {
        handleCloseBackdrop();
        navigate('/');
      }, 2000);
    } catch (err) {
      handleCloseBackdrop();
      console.log(err);
    }
  };

  return (
    <>
      <h1>
        {isOwner
          ? "You are the Organizer"
          : `You are ${queuePosition} in Queue`}
      </h1>
      {(queuePosition === 1 || isOwner) && (
        <div style={{ display: "flex", height: "80vh" }}>
          <div className="column">
            <h2 style={{ textAlign: "center", margin: 50 }}>Stage</h2>
            {Array(rows)
              .fill(1)
              .map((row, rowIdx) => (
                <div className="center">
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
                            disabled={isOwner}
                            style={{
                              width: 70,
                              margin: 10,
                              backgroundColor: seatCategories[seatNum - 1],
                            }}
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
          {!isOwner && (
            <div className="column">
              <h2 style={{ textAlign: "center", margin: 50 }}>
                Seat Selection
              </h2>
              <Form onSubmit={handleBuyTicket} style={{ paddingBottom: 30 }}>
                {selectedSeats.map((seat, idx) => (
                  <Form.Group className="m-5">
                    <h4>Seat No: {seat.seatNum}</h4>
                    <h4>
                      Category:{" "}
                      <span
                        style={{ color: CATEGORY_COLOR[seat.category - 1] }}
                      >
                        {seat.category}
                      </span>
                    </h4>
                    <h4>Amount: {seat.cost} ETH</h4>
                    <Form.Control
                      name={`passport${idx + 1}`}
                      placeholder="Enter your passport ID"
                    />
                  </Form.Group>
                ))}
                {selectedSeats.length > 0 && (
                  <Button style={{ marginLeft: 45 }} type="submit">
                    Buy Tickets
                  </Button>
                )}
              </Form>
            </div>
          )}
        </div>
      )}
      <Backdrop sx={{ color: '#fff', zIndex: 9999 }} open={openBackdrop} >
          <CircularProgress color="inherit" />
          &nbsp; &nbsp; Wait a moment...
        </Backdrop>
        <SnackbarAlert openAlert={openAlert} handleCloseAlert={handleCloseAlert} alertType={alertType} alertMessage={alertMessage} />
    </>
  );
}

export default Seats;
