import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Header from "./Header";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import { CONCERT } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(CONCERT, Concert.abi, signer);

function AllConcerts() {
  const [concert, setConcert] = useState("");

  const getConcert = async () => {
    const name = await contract.getName(1);
    setConcert(name);
  };

  // const onlyOwnerMethod = async () => {
  //   try {
  //     await contract.deleteConcert(1);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  useEffect(() => {
    getConcert();

    //onlyOwnerMethod();
  }, []);

  return (
    <>
      <Header />
      <NavBar />
      <h2>Concert: {concert}</h2>
    </>
  );
}

export default AllConcerts;
