import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import Register from "./pages/Register";
import HouseholdDetail from "./pages/HouseholdDetail";
import Marker from "./pages/Marker";
import SmsSimulator from "./pages/SmsSimulator";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/household/:plusCode" element={<HouseholdDetail />} />
          <Route path="/household/:plusCode/marker" element={<Marker />} />
          <Route path="/sms-fallback" element={<SmsSimulator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="page-footer">
        <div className="container">
          <p>
            DoorStep Trust Network — a solo portfolio prototype built on Google's open
            Plus Codes format. Not affiliated with Google.
          </p>
        </div>
      </footer>
    </BrowserRouter>
  );
}
