import React from "react";

function Header({ children }) {
  return (
    <div className="app">
      <div className="app-header">
        <h1>React dApp authentication with React, We3.js and Metamask</h1>
      </div>
      <div className="app-wrapper">{children}</div>
    </div>
  );
}

export default Header;
