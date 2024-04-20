import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import Nav from "react-bootstrap/Nav";
import { useLocation } from "react-router-dom";

import { ORGANIZER } from "../constants/Address";
import { ethers } from "ethers";

const NavBar = () => {
  const location = useLocation();

  const [isOwner, setIsOwner] = useState(false);

  const getAccountOnLoad = async () => {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts"  });
    setIsOwner(accounts[0] == ORGANIZER);
  };

  useEffect(() => {
    getAccountOnLoad();
  }, []);

  return (
    <div className="center" >
      <Nav variant="pills" activeKey={location.pathname}>
        {isOwner && (<Nav.Item>
          <Nav.Link href="/concerts">Concert Initialization</Nav.Link>
        </Nav.Item>)}
        <Nav.Item>
          <Nav.Link href="/">Marketplace</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/secondary-marketplace">
            Secondary Marketplace
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/tickets">Tickets</Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
    // <div style={{ textAlign: "center", marginBottom: 30 }}>
    //   <NavLink
    //     to="/home"
    //     exact
    //     style={({ isActive }) => ({
    //       color: isActive ? "#fff" : "#545e6f",
    //       background: isActive ? "#7600dc" : "#f0f0f0",
    //       marginRight: 15,
    //       textDecoration: "none",
    //       fontSize: "1.2em",
    //     })}
    //   >
    //     All Concerts
    //   </NavLink>
    //   <NavLink
    //     to="/marketplace"
    //     style={({ isActive }) => ({
    //       color: isActive ? "#fff" : "#545e6f",
    //       background: isActive ? "#7600dc" : "#f0f0f0",
    //       marginRight: 15,
    //       textDecoration: "none",
    //       fontSize: "1.2em",
    //     })}
    //   >
    //     Marketplace
    //   </NavLink>
    //   <NavLink
    //     to="/secondary-marketplace"
    //     style={({ isActive }) => ({
    //       color: isActive ? "#fff" : "#545e6f",
    //       background: isActive ? "#7600dc" : "#f0f0f0",
    //       marginRight: 15,
    //       textDecoration: "none",
    //       fontSize: "1.2em",
    //     })}
    //   >
    //     Secondary Marketplace
    //   </NavLink>
    // </div>
  );
};

export default NavBar;
