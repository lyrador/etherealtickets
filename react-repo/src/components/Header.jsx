import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ORGANIZER } from "../constants/Address";
import Button from "react-bootstrap/Button";

function Header() {
  // const [account, setAccount] = useState(null);
  // const [role, setRole] = useState("");
  // const navigate = useNavigate();
  // const location = useLocation();

  // const getMetamaskAccount = async () => {
  //   if (location.pathname !== "/") {
  //     const [address] = await window.ethereum.request({
  //       method: "eth_requestAccounts",
  //     });
  //     setAccount(address);

  //     if (address == ORGANIZER) {
  //       setRole("Organizer");
  //     } else {
  //       setRole("Concert Goer");
  //     }
  //   }
  // };

  // useEffect(() => {
  //   getMetamaskAccount();
  // }, []);

  // const login = async () => {
  //   navigate("/home");
  // };

  // const logout = () => {
  //   navigate("/");
  // };

  return (
    <div className="app-header">
      <h1>EtherealTickets</h1>
      {/* <h3>
        {account
          ? `You are logged in as ${account} (${role})`
          : "You are not logged in"}
      </h3>
      {account ? (
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      ) : (
        <Button variant="secondary" onClick={login}>
          Login
        </Button>
      )} */}
    </div>
  );
}

export default Header;
