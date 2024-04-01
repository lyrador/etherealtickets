import { Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import AllConcerts from "./components/AllConcerts";
import Marketplace from "./components/Marketplace";
import SecondaryMarketplace from "./components/SecondaryMarketplace";

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route path="/home" element={<AllConcerts />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
          path="/secondary-marketplace"
          element={<SecondaryMarketplace />}
        />
      </Routes>
    </div>
  );
}

export default App;
