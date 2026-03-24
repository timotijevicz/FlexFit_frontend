import "./Navbar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/useAppContext";

const Navbar = () => {
  const { authToken, isAdmin, isEmployee, isMember, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/prijava");
  };

  // Logic: Everyone (including guests) can see Članarina
  // Members, Employees, and Admins can see Dashboard, Objekti, Kazne
  // Employees and Admins can see Redar
  // Only Admins can see Admin page
  const showBasic = isAdmin || isEmployee || isMember;
  const showRedar = isAdmin || isEmployee;
  const showAdmin = isAdmin;

  return (
    <nav className="navbar">
      <h4 className="logo">FlexFit</h4>

      <div className="links">
        {showBasic && <NavLink to="/dashboard">Početna</NavLink>}
        {showBasic && <NavLink to="/objekti">Objekti</NavLink>}
        {isMember && <NavLink to="/clanarina">Članarina</NavLink>}
        {showBasic && <NavLink to="/kazne">Kazne</NavLink>}
        {showRedar && <NavLink to="/redar">Redar</NavLink>}
        {showAdmin && <NavLink to="/admin">Admin</NavLink>}
      </div>

      {authToken ? (
        <button className="logout" onClick={handleLogout}>
          Odjava
        </button>
      ) : (
        <div className="links">
          <NavLink to="/prijava">Prijava</NavLink>
        </div>
      )}
    </nav>
  );
};

export default Navbar;