import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerMember } from "../../services/authService";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    jmbg: "",
    cardNumber: "",
    personalTrainer: false,
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.address.trim() ||
      !formData.jmbg.trim() ||
      !formData.cardNumber.trim()
    ) {
      setError("Popuni sva polja.");
      return;
    }

    try {
      const data = await registerMember(formData);
      if (data) {
         navigate("/prijava");
      } else {
         setError("Greška pri registraciji.");
      }
    } catch(err) {
      setError("Greška u komunikaciji sa serverom.");
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg-orb orb-one"></div>
      <div className="register-bg-orb orb-two"></div>

      <div className="register-box">
        <p className="register-kicker">FlexFit Registracija</p>
        <h2>Registracija</h2>
        <p className="register-subtitle">
          Kreiraj nalog i pristupi svim FlexFit funkcionalnostima.
        </p>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label>Ime</label>
            <input
              type="text"
              name="firstName"
              placeholder="Unesi ime"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Prezime</label>
            <input
              type="text"
              name="lastName"
              placeholder="Unesi prezime"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Unesi email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Lozinka</label>
            <input
              type="password"
              name="password"
              placeholder="Unesi lozinku"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Adresa</label>
            <input
              type="text"
              name="address"
              placeholder="Unesi adresu"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>JMBG</label>
            <input
              type="text"
              name="jmbg"
              placeholder="Unesi JMBG"
              value={formData.jmbg}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Broj kartice (dobijen od redara)</label>
            <input
              type="text"
              name="cardNumber"
              placeholder="Unesi broj dobijene pretplatne kartice"
              value={formData.cardNumber}
              onChange={handleChange}
            />
          </div>

          <div className="input-group" style={{flexDirection: "row", alignItems: "center", gap: "10px"}}>
            <input
              type="checkbox"
              name="personalTrainer"
              checked={formData.personalTrainer}
              onChange={(e) => setFormData(prev => ({...prev, personalTrainer: e.target.checked}))}
              style={{width: "auto"}}
            />
            <label style={{marginBottom: 0}}>Personalni trener</label>
          </div>

          {error && <p className="register-error">{error}</p>}

          <button type="submit" className="register-btn">
            Registruj se
          </button>
        </form>

        <p className="register-footer-text">
          Već imaš nalog? <Link to="/prijava">Prijavi se</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;