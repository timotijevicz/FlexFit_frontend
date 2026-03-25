import { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/useAppContext";
import { loginUser } from "../../services/authService";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAppContext();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: "827644666382-igm4g6hgimb2lrukhd90g84mhii7o06s.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", width: 360 } // Changed 100% to 360px
      );
    }
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      setIsSubmitting(true);
      const decoded = JSON.parse(atob(response.credential.split(".")[1]));
      
      const data = await loginUser({
        email: decoded.email,
        isGoogle: true
      });

      if (data && data.accessToken) {
        login(data.accessToken, data.refreshToken);
        navigate("/dashboard");
      } else {
        setError("Google prijava nije uspela.");
      }
    } catch (err) {
      console.error(err);
      setError("Greška pri Google prijavi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Unesi email i lozinku.");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      if (data && data.accessToken) {
        login(data.accessToken, data.refreshToken);
        navigate("/dashboard");
      } else {
        setError("Greška pri prijavi.");
      }
    } catch (err) {
      console.log(err);
      setError("Greška pri povezivanju sa serverom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb orb-one"></div>
      <div className="login-bg-orb orb-two"></div>

      <div className="login-box">
        <p className="login-kicker">FlexFit Prijava</p>
        <h2>Prijava</h2>
        <p className="login-subtitle">
          Prijavi se na svoj nalog i nastavi sa korišćenjem sistema.
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Unesi email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>

        <div className="login-divider">
          <span>ILI</span>
        </div>

        <div id="googleSignInDiv" className="google-btn-container"></div>

        <button 
          type="button" 
          className="daily-pass-btn" 
          onClick={() => navigate("/clanarina")}
        >
          <span className="btn-icon">🎟️</span>
          Dnevna karta
        </button>

        <p className="login-footer-text">
          Nemaš nalog? <Link to="/registracija">Registruj se</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;