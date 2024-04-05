import React, { useEffect } from "react";
import NavBar from "./NavBar";
import Header from "./Header";

import { ethers } from "ethers";
import Concert from "../contracts/Concert.json";
import { CONCERT } from "../constants/Address";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(CONCERT, Concert.abi, signer);

function Marketplace() {
  const fetchMarketplaceData = async () => {
    const result = await contract.getConcertsByStage(1);
    console.log(result);
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  return (
    <>
      <Header />
      <NavBar />
      <h2>Marketplace</h2>
    </>
  );
}

export default Marketplace;
