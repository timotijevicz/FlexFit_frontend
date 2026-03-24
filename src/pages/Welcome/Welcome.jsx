import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/prijava");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome">
      <div className="welcome-bg-orb orb-one"></div>
      <div className="welcome-bg-orb orb-two"></div>

      <div className="welcome-content">
        <p className="welcome-kicker">FlexFit System</p>
        <h1 className="logo">FlexFit</h1>
        <p className="tagline">Tvoja forma. Tvoja pravila.</p>

        <div className="loader-wrap">
          <div className="spinner"></div>
          <p className="loading">Učitavanje sistema...</p>
        </div>

        <p className="redirect-note">
          Bićeš automatski preusmeren na prijavu za nekoliko sekundi.
        </p>
      </div>
    </div>
  );
};

export default Welcome;