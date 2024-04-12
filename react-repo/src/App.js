import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import AllConcerts from "./components/AllConcerts";
import MarketplacePage from "./components/MarketplacePage";
import SecondaryMarketplace from "./components/SecondaryMarketplace";
import Seats from "./components/Seats";
import Checkout from "./components/Checkout";

function App() {
  return (
    <div>
      <Routes>
        {/* <Route exact path="/" element={<Header />} /> */}
        <Route path="/" element={<AllConcerts />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/:id" element={<Seats />} />
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
