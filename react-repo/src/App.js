import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import AllConcerts from "./components/AllConcerts";
import MarketplacePage from "./components/MarketplacePage";
import SecondaryMarketplacePage from "./components/SecondaryMarketplacePage";
import Seats from "./components/Seats";
import Checkout from "./components/Checkout";
import TicketsPage from "./components/TicketsPage";

function App() {
  return (
    <div>
      <Routes>
        {/* <Route exact path="/" element={<Header />} /> */}
        <Route path="/concerts" element={<AllConcerts />} />
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/marketplace/:id" element={<Seats />} />
        <Route
          path="/secondary-marketplace"
          element={<SecondaryMarketplacePage />}
        />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;
