import { useState, useEffect } from "react";
import { useAppContext } from "../../context/useAppContext";
import { getAllPenaltyCards, getAllPenaltyPoints } from "../../services/penaltyService";
import { getAllFitnessObjects } from "../../services/fitnessObjectService";
import "./Penalties.css";

const Penalties = () => {
  const { isEmployee, isAdmin, userId } = useAppContext();

  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPenalties, setShowPenalties] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsRes, pointsRes] = await Promise.all([
        getAllPenaltyCards(),
        getAllPenaltyPoints()
      ]);

      const mappedCards = (Array.isArray(cardsRes) ? cardsRes : []).map(c => ({ ...c, type: 'Card' }));
      const mappedPoints = (Array.isArray(pointsRes) ? pointsRes : []).map(p => ({ ...p, type: 'Point' }));

      let allPenalties = [...mappedCards, ...mappedPoints].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Ako nije radnik ili admin, prikazi samo njegove kazne
      if (!isEmployee && !isAdmin && userId) {
        allPenalties = allPenalties.filter(p => p.memberId == userId);
      }

      setPenalties(allPenalties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isEmployee, isAdmin, userId]);



  const totalCount = penalties.length;
  const debtPenalties = penalties.filter(p => p.type === 'Card' && !p.isPaid && !p.isCanceled);
  const totalDebt = debtPenalties.reduce((sum, item) => sum + (item.price || 0), 0);
  const paidAmount = penalties.filter(p => p.type === 'Card' && p.isPaid && !p.isCanceled).reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="penalties">
      <div className="penalties-hero">
        <div>
          <p className="penalties-kicker">Pregled i Evidencija</p>
          <h1>Kazne i poeni</h1>
          <p className="penalties-subtitle">
            Evidencija svih aktivnih i storniranih kazni integrisana sa backend sistemom.
          </p>
        </div>
      </div>

      <div className="penalties-summary">
        <div className="summary-card blue-card">
          <div className="summary-top">
            <span className="summary-dot blue"></span>
            <h3>Ukupno izdato</h3>
          </div>
          <p className="summary-value">{totalCount}</p>
        </div>

        <div className={`summary-card ${totalDebt > 0 ? "red-card" : "green-card"}`} style={totalDebt === 0 ? {background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(15, 23, 42, 0.85))', border: '1px solid rgba(34, 197, 94, 0.2)'} : {}}>
          <div className="summary-top">
            <span className={`summary-dot ${totalDebt > 0 ? "red" : "green"}`}></span>
            <h3>{totalDebt > 0 ? "Preostali dug" : "Status duga"}</h3>
          </div>
          <p className="summary-value" style={{ color: totalDebt > 0 ? "#f87171" : "#4ade80" }}>
            {totalDebt > 0 ? `${totalDebt} RSD` : "Sve plaćeno (0 RSD)"}
          </p>
        </div>

        <div className="summary-card purple-card">
          <div className="summary-top">
            <span className="summary-dot purple"></span>
            <h3>Ukupno plaćeno</h3>
          </div>
          <p className="summary-value">{paidAmount} RSD</p>
        </div>
      </div>


      {loading ? (
        <div className="penalties-empty-state">Učitavanje...</div>
      ) : penalties.length === 0 ? (
        <div className="penalties-empty-state">Nema evidentiranih kazni ili poena.</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowPenalties(!showPenalties)}
              style={{ padding: "0.5rem 1rem", backgroundColor: "#334155", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {showPenalties ? "Sakrij istoriju kazni" : "Prikaži istoriju kazni"}
            </button>
          </div>
          {showPenalties && (
            <div className="penalty-list">
              {penalties.map((k, idx) => (
                <div className={`penalty-card ${k.isCanceled ? 'is-canceled' : ''}`} key={idx}>
                  <div className="penalty-card-top">
                    <h3>{k.type === 'Card' ? 'Kaznena Karta' : 'Kazneni Poen'}</h3>
                    <span className={`status-badge ${k.isCanceled ? "canceled" : (k.type === 'Point' ? "point" : (k.isPaid ? "paid" : "unpaid"))}`}>
                      {k.isCanceled ? "Stornirano" : (k.type === 'Point' ? "Aktivan" : (k.isPaid ? "Plaćeno" : "Neplaćeno"))}
                    </span>
                  </div>

                  <div className="penalty-info">
                    <div className="penalty-row">
                      <span>ID Člana</span>
                      <strong>{k.memberId}</strong>
                    </div>
                    {k.type === 'Card' && k.fitnessObject && (
                      <div className="penalty-row">
                        <span>Objekat</span>
                        <strong>{k.fitnessObject.name}</strong>
                      </div>
                    )}
                    <div className="penalty-row">
                      <span>Datum</span>
                      <strong>{new Date(k.date).toLocaleDateString()}</strong>
                    </div>
                    <div className="penalty-row">
                      <span>Razlog</span>
                      <strong>{k.reason || k.description}</strong>
                    </div>
                    {k.type === 'Card' && (
                      <div className="penalty-row">
                        <span>Iznos</span>
                        <strong>{k.price} RSD</strong>
                      </div>
                    )}
                    {k.isCanceled && k.cancelReason && (
                      <div className="penalty-row" style={{ marginTop: '0.5rem' }}>
                        <span style={{ color: '#fbbf24' }}>Napomena o storniranju</span>
                        <strong style={{ color: '#fbbf24' }}>{k.cancelReason}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Penalties;