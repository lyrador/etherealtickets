import React from "react";
import { NavLink } from "react-router-dom";

const NavBar = () => {
  return (
    <div style={{ textAlign: "center", marginBottom: 30 }}>
      <NavLink
        to="/home"
        exact
        style={({ isActive }) => ({
          color: isActive ? "#fff" : "#545e6f",
          background: isActive ? "#7600dc" : "#f0f0f0",
          marginRight: 15,
          textDecoration: "none",
          fontSize: "1.2em",
        })}
      >
        All Concerts
      </NavLink>
      <NavLink
        to="/marketplace"
        style={({ isActive }) => ({
          color: isActive ? "#fff" : "#545e6f",
          background: isActive ? "#7600dc" : "#f0f0f0",
          marginRight: 15,
          textDecoration: "none",
          fontSize: "1.2em",
        })}
      >
        Marketplace
      </NavLink>
      <NavLink
        to="/secondary-marketplace"
        style={({ isActive }) => ({
          color: isActive ? "#fff" : "#545e6f",
          background: isActive ? "#7600dc" : "#f0f0f0",
          marginRight: 15,
          textDecoration: "none",
          fontSize: "1.2em",
        })}
      >
        Secondary Marketplace
      </NavLink>
    </div>
  );
};

export default NavBar;
