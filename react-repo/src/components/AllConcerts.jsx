import React, { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Header from "./Header";

function AllConcerts() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const address = localStorage.getItem("currAccount");
    setAccount(address);
  }, []);

  const logout = () => {
    localStorage.removeItem("currAccount");
    navigate("/");
  };

  return (
    <Header>
      <NavBar />
      <div className="app-details">
        <h2> You are connected to metamask.</h2>
        <div className="app-balance">
          <span>Account: </span>
          {account}
        </div>
      </div>
      <div>
        <button className="app-buttons__logout" onClick={logout}>
          Disconnect
        </button>
      </div>
    </Header>

    // <div className="app">
    //   <div className="app-header">
    //     <h1>React dApp authentication with React, We3.js and Metamask</h1>
    //     <NavBar />
    //   </div>
    //   {account && (
    //     <div className="app-wrapper">
    //       <div className="app-details">
    //         <h2> You are connected to metamask.</h2>
    //         <div className="app-balance">
    //           <span>Account: </span>
    //           {account}
    //         </div>
    //       </div>
    //       <div>
    //         <button className="app-buttons__logout" onClick={logout}>
    //           Disconnect
    //         </button>
    //       </div>
    //     </div>
    //   )}
    // </div>
  );
}

export default AllConcerts;
