import { useState, useEffect } from "react";
import "./Membership.css";
import { QRCodeCanvas } from "qrcode.react";
import { getAllMembershipCards } from "../../services/cardService";
import { useAppContext } from "../../context/useAppContext";

const Membership = () => {
  const { userId, email: userEmail } = useAppContext();

  const [allCards, setAllCards] = useState([]);
  const [userCard, setUserCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activationCode, setActivationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getAllMembershipCards()
      .then((cards) => {
        if (!isMounted) return;
        const cardsArray = Array.isArray(cards) ? cards : [];
        setAllCards(cardsArray);

        if (userId) {
          const myCard = cardsArray.find(c => 
             (c.memberId && Number(c.memberId) === Number(userId)) || 
             (userEmail && c.email === userEmail)
          );
          if (myCard) setUserCard(myCard);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [userId, userEmail]);

  const handleActivate = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!activationCode.trim()) {
      setError("Unesi broj dnevne kartice.");
      return;
    }

    const foundCard = allCards.find(c => c.cardNumber === activationCode.trim());
    
    if (foundCard) {
      if (foundCard.validFrom !== undefined) {
        setError("Ovo je pretplatna kartica. Pretplatne kartice se automatski pojavljuju na profilu člana.");
      } else {
        setUserCard(foundCard);
        setMessage("Dnevna kartica je uspešno aktivirana / očitana!");
      }
    } else {
      setError("Kartica nije pronađena u bazi.");
    }
  };

  const getCardStatus = () => {
    if (!userCard) return "Nema kartice";
    if (userCard.validFrom !== undefined) {
      return userCard.validFrom ? "Aktivna" : "Neaktivna (čeka logovanje)";
    }
    return "Dnevna (Aktivna)";
  };

  if (loading) {
    return <div className="membership"><p style={{color: 'white', padding: '2rem'}}>Učitavanje...</p></div>;
  }

  return (
    <div className="membership">
      <div className="membership-hero">
        <div>
          <p className="membership-kicker">FlexFit Članarina</p>
          <h1>Moja članarina</h1>
          <p className="membership-subtitle">
            Pregled tvoje digitalne kartice i statusa članarine.
          </p>
        </div>
      </div>

      <div className="membership-grid">
        <section className="membership-card-panel">
          <div className="section-heading">
            <span className="section-dot blue"></span>
            <h2>Kartica</h2>
          </div>

          <div className="membership-card-box">
            <div className="membership-card-top">
              <div>
                <p className="membership-card-label">Tip kartice</p>
                <h3>{userCard ? (userCard.validFrom !== undefined ? "Pretplatna" : "Dnevna") : "Nema kartice"}</h3>
              </div>

              <span className={`membership-badge ${getCardStatus() === 'Aktivna' || getCardStatus().includes('Dnevna') ? 'active' : 'pending'}`}>
                {getCardStatus()}
              </span>
            </div>

            <div className="membership-info">
              {userCard && userCard.validFrom !== undefined ? (
                 <>
                   <div className="membership-info-row">
                     <span>Važi od</span>
                     <strong>{userCard.validFrom ? new Date(userCard.validFrom).toLocaleDateString() : "-"}</strong>
                   </div>
                   <div className="membership-info-row">
                     <span>Važi do</span>
                     <strong>{userCard.validTo ? new Date(userCard.validTo).toLocaleDateString() : "-"}</strong>
                   </div>
                   <div className="membership-info-row">
                     <span>Personalni trener</span>
                     <strong>{userCard.personalTrainer ? "Da" : "Ne"}</strong>
                   </div>
                 </>
              ) : userCard ? (
                 <>
                   <div className="membership-info-row">
                     <span>Kupljena</span>
                     <strong>{userCard.purchaseDate ? new Date(userCard.purchaseDate).toLocaleDateString() : "-"}</strong>
                   </div>
                 </>
              ) : (
                 <p style={{color: '#94a3b8'}}>Trenutno nemaš dodeljenu karticu.</p>
              )}

              <div className="membership-info-row">
                <span>Korisnik</span>
                <strong>{userEmail || "Nepoznato"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="qr-panel">
          <div className="section-heading">
            <span className="section-dot purple"></span>
            <h2>Digitalna kartica (QR Kod)</h2>
          </div>

          <div className="qr-box">
            {userCard ? (
              <>
                <div className="qr-code-wrapper">
                  <QRCodeCanvas 
                    value={userCard.cardNumber} 
                    size={200} 
                    includeMargin={true}
                    level="H"
                  />
                  <div className="qr-scan-line"></div>
                </div>
                <div className="qr-card-info">
                  <p className="qr-label">Broj kartice</p>
                  <code className="qr-number">{userCard.cardNumber}</code>
                </div>
                <p className="qr-instruction">Pokaži ovaj kod na ulazu u objekat</p>
              </>
            ) : (
              <div style={{width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #334155', borderRadius: '8px', margin: '0 auto 1rem'}}>
                 <span style={{color: '#64748b'}}>Nema koda</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {(!userCard || userCard.validFrom === undefined) && (
        <div className="membership-bottom-grid">
          <section className="activation-panel">
            <div className="section-heading">
              <span className="section-dot green"></span>
              <h2>Aktiviraj / Učitaj Dnevnu Karticu</h2>
            </div>

            <form onSubmit={handleActivate} className="activation-form">
              <input
                type="text"
                placeholder="Unesi kod dnevne kartice (npr. FF-ABCD)"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
              />

              <button type="submit">Aktiviraj</button>
            </form>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
          </section>
        </div>
      )}
    </div>
  );
};

export default Membership;