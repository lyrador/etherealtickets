import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ORGANIZER } from "../constants/Address";

function Header() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const address = localStorage.getItem("currAccount");
    setAccount(address);

    if (address == ORGANIZER) {
      setRole("Organizer");
    } else {
      setRole("Concert Goer");
    }
  }, []);

  const login = async () => {
    const [address] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    localStorage.setItem("currAccount", address);

    navigate("/home");
  };

  const logout = () => {
    localStorage.removeItem("currAccount");
    navigate("/");
  };

  return (
    <div className="app-header">
      <h1>EtherealTickets</h1>
      <h2>
        {account
          ? `You are logged in as ${account} (${role})`
          : "You are not logged in"}
      </h2>
      {account ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}

export default Header;
