import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Header from "./Header";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import { CONCERT, ORGANIZER } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(CONCERT, Concert.abi, signer);

function AllConcerts() {
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

  useEffect(() => {
    getAccountOnLoad();

    // Subscribe to Metamask account changes
    window.ethereum.on("accountsChanged", handleAccountsChanged);
  }, []);

  return (
    <>
      <Header />
      <NavBar />
      {isOwner ? (
        <h2>Display Concert Table</h2>
      ) : (
        <h2>You do not have access to this tab</h2>
      )}
    </>
  );
}

export default AllConcerts;
