import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import AllConcerts from "./components/AllConcerts";
import MarketplacePage from "./components/MarketplacePage";
import SecondaryMarketplacePage from "./components/SecondaryMarketplacePage";
import Seats from "./components/Seats";
import Checkout from "./components/Checkout";
import TicketsPage from "./components/TicketsPage";
import TicketsTab from "./components/TicketsTab";

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
          element={<SecondaryMarketplacePage />}
        />
        <Route path="/tickets" element={<TicketsTab />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;
