import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import AllConcerts from "./components/AllConcerts";
import Marketplace from "./components/Marketplace";
import SecondaryMarketplace from "./components/SecondaryMarketplace";
import Checkout from "./components/Checkout";

function App() {
  return (
    <div>
      <Routes>
        <Route exact path="/" element={<Header />} />
        <Route path="/home" element={<AllConcerts />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
          path="/secondary-marketplace"
          element={<SecondaryMarketplace />}
        />
        <Route path="/checkout" element={<Checkout />}/>
      </Routes>
    </div>
  );
}

export default App;
