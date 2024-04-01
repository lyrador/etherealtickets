import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

function Login() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);

  const authenticate = async () => {
    const [address] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    localStorage.setItem("currAccount", address);

    navigate("/home");
  };

  return (
    <Header>
      <div>
        <button className="app-button__login" onClick={authenticate}>
          Login
        </button>
      </div>
    </Header>
  );
}

export default Login;
