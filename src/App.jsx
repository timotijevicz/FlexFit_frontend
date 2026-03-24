import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Welcome from "./pages/Welcome/Welcome";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Facilities from "./pages/Facilities/Facilities";
import FacilityDetails from "./pages/Facilities/FacilityDetails";
import Membership from "./pages/Membership/Membership";
import Guard from "./pages/Guard/Guard";
import Penalties from "./pages/Penalties/Penalties";
import Admin from "./pages/Admin/Admin";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

function Layout() {
  const location = useLocation();

  // sakrij navbar na ovim stranicama
  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/prijava" ||
    location.pathname === "/registracija";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/prijava" element={<Login />} />
        <Route path="/registracija" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/objekti" element={<Facilities />} />
        <Route path="/objekti/:id" element={<FacilityDetails />} />
        <Route path="/clanarina" element={<Membership />} />
        <Route path="/redar" element={<Guard />} />
        <Route path="/kazne" element={<Penalties />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {!hideNavbar && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;