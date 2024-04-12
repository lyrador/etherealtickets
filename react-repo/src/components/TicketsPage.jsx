import React, { useEffect, useState } from "react";
import Header from "./Header";
import NavBar from "./NavBar";

import { ethers } from "ethers";
import Ticket from "../contracts/Ticket.json";
import { TICKET, ORGANIZER } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const ticketContract = new ethers.Contract(TICKET, Ticket.abi, signer);

function TicketsPage() {
  const [isOwner, setIsOwner] = useState(false);

  const getAccountOnLoad = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setIsOwner(accounts[0] == ORGANIZER);
  };

  const handleAccountsChanged = (accounts) => {
    setIsOwner(accounts[0] == ORGANIZER);
  };

  const fetchTicketsData = async () => {
    const ownedTickets = await ticketContract.getOwnedTickets();
    console.log(ownedTickets);
  };

  useEffect(() => {
    // fetchTicketsData();

    getAccountOnLoad();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
  }, []);

  useEffect(() => {
    if (!isOwner) {
      fetchTicketsData();
    } else {
      console.log("Organizer");
    }
  }, [isOwner]);

  return (
    <>
      <Header />
      <NavBar />
      {isOwner ? (
        <h2>View Tickets for Open Concerts / Validate Ticket</h2>
      ) : (
        <h2>View Owned Tickets</h2>
      )}
    </>
  );
}

export default TicketsPage;
