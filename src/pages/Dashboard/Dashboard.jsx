import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { getAllFitnessObjects } from "../../services/fitnessObjectService";
import { getAllMembershipCards } from "../../services/cardService";
import { apiFetch } from "../../services/api";
import { useAppContext } from "../../context/useAppContext";

const POLL_INTERVAL_MS = 10000; // poll every 10 seconds

const Dashboard = () => {
  const navigate = useNavigate();
  const { userId, isMember } = useAppContext();

  const [facilityCount, setFacilityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cardStatus, setCardStatus] = useState(null); // null = unknown
  const [penaltyPoints, setPenaltyPoints] = useState(null);

  const fetchMembershipStatus = useCallback(async () => {
    if (!userId || !isMember) return;
    try {
      const cards = await getAllMembershipCards();
      const memberCards = Array.isArray(cards)
        ? cards.filter(c => c.memberId == userId && !c.purchaseDate)
        : [];

      const now = new Date();
      const activeCard = memberCards.find(
        c => c.isActive && c.validTo && new Date(c.validTo) > now
      );
      setCardStatus(activeCard ? "Aktivna" : "Neaktivna");
    } catch {
      setCardStatus("Greška");
    }
  }, [userId, isMember]);

  const fetchPenaltyPoints = useCallback(async () => {
    if (!userId || !isMember) return;
    try {
      const points = await apiFetch("/api/Penalties/points");
      const myPoints = Array.isArray(points)
        ? points.filter(p => p.memberId == userId).length
        : 0;
      setPenaltyPoints(myPoints);
    } catch {
      setPenaltyPoints("—");
    }
  }, [userId, isMember]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const facilities = await getAllFitnessObjects();
      setFacilityCount(Array.isArray(facilities) ? facilities.length : 0);
    } catch (err) {
      setError(err.message || "Greška pri učitavanju dashboard podataka.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
    fetchMembershipStatus();
    fetchPenaltyPoints();
  }, [loadDashboardData, fetchMembershipStatus, fetchPenaltyPoints]);

  // Continuous polling
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMembershipStatus();
      fetchPenaltyPoints();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMembershipStatus, fetchPenaltyPoints]);

  const cardStatusColor =
    cardStatus === "Aktivna" ? "#4ade80" : cardStatus === "Neaktivna" ? "#f87171" : "#94a3b8";

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-kicker">FlexFit Početna</p>
          <h1>Dobrodošao!</h1>
          <p className="dashboard-subtitle">
            Ovde možeš brzo da vidiš pregled sistema i da pristupiš glavnim
            funkcionalnostima aplikacije.
          </p>
        </div>
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      <main className="dashboard-main">
        <div className="dashboard-cards">
          <div className="dashboard-card blue-card">
            <div className="card-top">
              <span className="card-dot blue"></span>
              <h3>Ukupno objekata</h3>
            </div>
            <p className="card-value">
              {loading ? "..." : facilityCount}
            </p>
            <span className="card-note">Preuzeto iz sistema</span>
          </div>

          {isMember && (
            <div className="dashboard-card purple-card">
              <div className="card-top">
                <span className="card-dot purple"></span>
                <h3>Status članarine</h3>
              </div>
              <p className="card-value" style={{ color: cardStatusColor }}>
                {cardStatus ?? "..."}
              </p>
              <span className="card-note">
                Osvežava se svakih 10s
              </span>
            </div>
          )}

          {isMember && (
            <div className="dashboard-card red-card">
              <div className="card-top">
                <span className="card-dot red"></span>
                <h3>Kazneni poeni</h3>
              </div>
              <p className="card-value">
                {penaltyPoints ?? "..."}
              </p>
              <span className="card-note">
                Osvežava se svakih 10s
              </span>
            </div>
          )}
        </div>

        <div className="dashboard-bottom-grid">
          <section className="dashboard-panel">
            <div className="panel-header">
              <span className="card-dot green"></span>
              <h2>Brze akcije</h2>
            </div>

            <div className="quick-actions">
              <button onClick={() => navigate("/objekti")}>
                Pregled objekata
              </button>
              {isMember && (
                <>
                  <button onClick={() => navigate("/clanarina")}>
                    Članarina
                  </button>
                  <button onClick={() => navigate("/kazne")}>
                    Kazne
                  </button>
                </>
              )}
            </div>
          </section>


        </div>
      </main>
    </div>
  );
};

export default Dashboard;