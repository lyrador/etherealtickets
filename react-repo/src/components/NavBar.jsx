import React from "react";
import { NavLink } from "react-router-dom";

import Nav from "react-bootstrap/Nav";
import { useLocation } from "react-router-dom";

const NavBar = () => {
  const location = useLocation();

  return (
    <div className="center">
      <Nav variant="pills" activeKey={location.pathname}>
        <Nav.Item>
          <Nav.Link href="/home">Home</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/marketplace">Marketplace</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/secondary-marketplace">
            Secondary Marketplace
          </Nav.Link>
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
