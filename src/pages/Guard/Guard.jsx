import "./Guard.css";
import { useMemo, useState, useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { jwtDecode } from "jwt-decode";
import { createDailyCard, createSubscriptionCard, checkCardCodeUnique, getAllMembershipCards, extendMembership, logEntry } from "../../services/cardService";
import { useAppContext } from "../../context/useAppContext";
import { createPenaltyCard, payPenalty, getAllPenaltyCards } from "../../services/penaltyService";
import { getAllFitnessObjects } from "../../services/fitnessObjectService";
import { getAllMembers } from "../../services/memberService";


const Guard = () => {
  const { userId, authToken } = useAppContext();
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const getGuaranteedUserId = () => {
    if (userIdRef.current) return Number(userIdRef.current);
    // Fallback: ručno dekodiraj token iz storage-a ako context kaska
    const token = authToken || localStorage.getItem("authToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.sub || decoded.nameid;
        return Number(id);
      } catch (err) {
        return 0;
      }
    }
    return 0;
  };

  const [qrData, setQrData] = useState("");

  const checkIsCardActive = (card) => {
    if (!card) return false;
    // Ako je pretplatna, proveri datum važenja I isActive flag u bazi
    if (card.validTo !== undefined) {
      if (!card.isActive) return false;
      if (!card.validTo) return false;
      return new Date(card.validTo) >= new Date();
    }
    // Ako je dnevna, proveri da li je kupljena danas
    if (card.purchaseDate !== undefined) {
      if (!card.purchaseDate) return false;
      return new Date(card.purchaseDate).toDateString() === new Date().toDateString();
    }
    return true; // Podrazumevano
  };

  const handlePayPenalty = async (penaltyId) => {
    try {
      setPenaltyLoading(true);
      await payPenalty(penaltyId);
      setMessage("Kazna uspešno plaćena. Dug umanjen.");
      // Refresh member data
      const allPenalties = await getAllPenaltyCards();
      const target = manualSearchResult || displayedMember;
      if (target) {
        const memberPenalties = allPenalties.filter(p => (Number(p.memberId) === Number(target.id)) && !p.isPaid && !p.isCanceled);
        const updated = {
          ...target,
          debt: memberPenalties.reduce((sum, p) => sum + p.price, 0),
          unpaidPenalties: memberPenalties
        };
        setSearchResult(prev => prev ? updated : null);
        setManualSearchResult(prev => prev ? updated : null);
      }
    } catch (err) {
      setError("Greška pri plaćanju kazne.");
    } finally {
      setPenaltyLoading(false);
    }
  };
  const [manualQuery, setManualQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [fitnessObjects, setFitnessObjects] = useState([]);
  const [dailyCardData, setDailyCardData] = useState({ fitnessObjectIds: [] });
  const [subCardData, setSubCardData] = useState({ memberId: "", personalTrainer: false });
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [penaltyLoading, setPenaltyLoading] = useState(false);
  const [quickEntryValue, setQuickEntryValue] = useState("");
  const [manualSearchResult, setManualSearchResult] = useState(null);
  const [creationMessage, setCreationMessage] = useState("");
  const [creationError, setCreationError] = useState("");

  useEffect(() => {
    getAllFitnessObjects()
      .then((data) => setFitnessObjects(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    getAllMembershipCards()
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    getAllMembers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, []);

  const displayedMember = useMemo(() => {
    if (searchResult) return searchResult;
    return null;
  }, [searchResult]);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!manualQuery.trim()) {
      setManualSearchResult(null);
      return;
    }
    if (!manualQuery.trim()) {
      setError("Unesi broj kartice ili ID.");
      return;
    }

    const val = manualQuery.trim();
    const foundCard = cards.find(c => c.cardNumber === val || c.memberId == val);

    if (foundCard) {
      const member = members.find(m => (m.id || m.Id) == foundCard.memberId);
      const memberName = member ? `${member.firstName} ${member.lastName}` : (foundCard.memberId ? `Član ID: ${foundCard.memberId}` : "Anonimni korisnik");

      // Fetch member penalties for debt calculation
      const allPenalties = await getAllPenaltyCards();
      const memberPenalties = allPenalties.filter(p => Number(p.memberId) === Number(foundCard.memberId) && !p.isCanceled);
      const unpaidPenalties = memberPenalties.filter(p => !p.isPaid);
      const paidPenaltiesCount = memberPenalties.filter(p => p.isPaid).length;
      const totalDebt = unpaidPenalties.reduce((sum, p) => sum + p.price, 0);

      const isActive = checkIsCardActive(foundCard);

      const res = {
        id: foundCard.memberId || foundCard.id,
        ime: memberName,
        kartica: foundCard.cardNumber,
        status: isActive ? "Aktivna" : "Nevažeća / Istekla",
        objekat: "-",
        tip: foundCard.validFrom !== undefined ? "Pretplatna" : "Dnevna",
        debt: totalDebt,
        unpaidPenalties: unpaidPenalties,
        hasPaidPenalties: paidPenaltiesCount > 0
      };

      setManualSearchResult(res);

      // Automatsko logovanje na backend
      const logPayload = {
        memberId: res.tip === 'Pretplatna' ? Number(res.id) : 0,
        fitnessObjectId: 1,
        cardNumber: res.kartica,
        cardStatus: isActive ? 'Active' : 'Expired/Invalid',
        cardType: res.tip,
        employeeId: getGuaranteedUserId()
      };
      console.log("SENDING LOG (Manual Search):", logPayload);
      await logEntry(logPayload);

      if (isActive) {
        setMessage("Kartica pronađena.");
      } else {
        setError("Kartica nije važeća, ulaz nije moguć.");
      }
    } else {
      setManualSearchResult({
        id: val,
        ime: "Nepoznato / Nije pronađeno",
        kartica: val,
        status: "Nevažeća",
        objekat: "-",
        tip: "Nemanipulativna"
      });
      setError("Kartica nije pronađena u bazi.");

      // Loguj incident za nepoznatu karticu
      const incidentPayload = {
        memberId: 0,
        fitnessObjectId: 1,
        cardNumber: val,
        cardStatus: 'Not Found',
        cardType: 'Unknown',
        employeeId: getGuaranteedUserId()
      };
      console.log("SENDING INCIDENT (Manual Search):", incidentPayload);
      await logEntry(incidentPayload);
    }
  };

  const handleIssuePenalty = async () => {
    if (!searchResult || !searchResult.id) return;
    try {
      setPenaltyLoading(true);
      await createPenaltyCard({
        memberId: Number(searchResult.id),
        fitnessObjectId: 1, // Podrazumevamo 1 ako nismo odabrali
        price: 2000, // Kaznena cena
        reason: "Ulazak bez važeće kartice"
      });
      setMessage("Kaznena karta uspešno izdata i zabeležena.");
      setError("");
    } catch (err) {
      setError(err.message || "Greška pri izdavanju kaznene karte.");
    } finally {
      setPenaltyLoading(false);
    }
  };

  const handleAllowEntry = async () => {
    if (!displayedMember) return;
    try {
      const logPayload = {
        memberId: Number(displayedMember.id),
        fitnessObjectId: 1, // Podrazumevano
        cardNumber: displayedMember.kartica,
        cardStatus: displayedMember.status.includes('Aktivna') ? 'Active' : 'Expired/Invalid',
        cardType: displayedMember.tip,
        employeeId: getGuaranteedUserId()
      };
      await logEntry(logPayload);
      setMessage("Ulaz uspešno zabeležen u MongoDB. " + (displayedMember.status.includes('Aktivna') ? "Odobreno." : "Automatska kazna izdata."));
      setError("");
    } catch (err) {
      setError("Greška pri logovanju ulaza.");
    }
  };

  const handleCreatePenalty = () => {
    setError("Generisanje kazne još nije povezano sa backendom.");
    setMessage("");
  };

  const handleQuickEntry = async (e) => {
    e.preventDefault();
    if (!quickEntryValue.trim()) return;

    setMessage("");
    setError("");

    const val = quickEntryValue.trim();
    // Brzi ulaz ide samo preko broja kartice
    const foundCard = cards.find(c => c.cardNumber === val);

    try {
      if (foundCard) {
        const isActive = checkIsCardActive(foundCard);
        const cardType = foundCard.validFrom !== undefined ? "Pretplatna" : "Dnevna";

        const logPayload = {
          memberId: cardType === 'Pretplatna' ? Number(foundCard.memberId || foundCard.id) : 0,
          fitnessObjectId: 1,
          cardNumber: foundCard.cardNumber,
          cardStatus: isActive ? 'Active' : 'Expired/Invalid',
          cardType: cardType,
          employeeId: getGuaranteedUserId()
        };
        console.log("SENDING LOG (Quick Entry):", logPayload);
        logEntry(logPayload).catch(() => { });

        // Prikazivanje detalja člana u kartici pored skenera
        const member = members.find(m => (m.id || m.Id) == foundCard.memberId);
        const memberName = member ? `${member.firstName} ${member.lastName}` : (foundCard.memberId ? `Član ID: ${foundCard.memberId}` : "Anonimni korisnik");

        setSearchResult({
          id: foundCard.memberId || foundCard.id,
          ime: memberName,
          kartica: foundCard.cardNumber,
          status: isActive ? "Aktivna" : "Nevažeća / Istekla",
          objekat: "-",
          tip: cardType
        });

        if (isActive) {
          setMessage("Ulaz odobren!");
          setError("");
        } else {
          setError("Kartica nije važeća, ulaz nije moguć.");
          setMessage("");
        }
      } else {
        setError("Kartica nije pronađena u bazi!");
        setMessage("");

        // Loguj incident
        const incidentPayload = {
          memberId: 0,
          fitnessObjectId: 1,
          cardNumber: val,
          cardStatus: 'Not Found',
          cardType: 'Unknown',
          employeeId: getGuaranteedUserId()
        };
        console.log("SENDING INCIDENT (Quick Entry):", incidentPayload);
        logEntry(incidentPayload).catch(() => { });
        setSearchResult(null);
      }
    } catch (err) {
      setError("Greška pri povezivanju sa serverom.");
      setMessage("");
    }

    setQuickEntryValue("");
  };

  const handleExtendMembership = async () => {
    if (!displayedMember || !displayedMember.kartica) return;
    try {
      setMessage("Produžavanje članarine...");
      setError("");
      await extendMembership(displayedMember.kartica);
      setMessage("Članarina uspešno produžena za 30 dana.");
      // Refresh cards list to see updated status
      getAllMembershipCards().then(data => setCards(Array.isArray(data) ? data : []));
      // Reset search result to show updated data if possible, or just clear it
      setSearchResult(prev => ({ ...prev, status: "Aktivna" }));
    } catch (err) {
      setError(err.message || "Greška pri produžavanju članarine.");
    }
  };

  const generateUniqueCode = async () => {
    let unique = false;
    let code = "";
    while (!unique) {
      code = Math.random().toString(36).substring(2, 10).toUpperCase();
      try {
        const res = await checkCardCodeUnique(code);
        if (res.isUnique) {
          unique = true;
        }
      } catch (err) {
        unique = true; // Fallback da ne upadne u infinite loop ako padne mreža
      }
    }
    return code;
  };

  const handleCreateDailyClick = async (e) => {
    e.preventDefault();
    try {
      setCreationError("");
      setCreationMessage("Generisanje koda...");
      const code = await generateUniqueCode();
      await createDailyCard({
        cardNumber: code,
        fitnessObjectIds: dailyCardData.fitnessObjectIds,
        purchaseDate: new Date().toISOString()
      });
      setCreationMessage("Dnevna kartica uspešno kreirana! Kod: " + code);
      getAllMembershipCards().then(data => setCards(Array.isArray(data) ? data : []));
    } catch (err) {
      setCreationError(err.message || "Greška pri kreiranju kartice");
    }
  };

  const handleCreateSubClick = async (e) => {
    e.preventDefault();
    try {
      setCreationError("");
      setCreationMessage("Generisanje koda...");
      const code = await generateUniqueCode();
      await createSubscriptionCard({
        cardNumber: code,
        memberId: subCardData.memberId ? Number(subCardData.memberId) : null,
        personalTrainer: subCardData.personalTrainer,
        validFrom: null,
        validTo: null
      });
      setCreationMessage("Pretplatna kartica uspešno kreirana! Kod: " + code);
      getAllMembershipCards().then(data => setCards(Array.isArray(data) ? data : []));
    } catch (err) {
      setCreationError(err.message || "Greška pri kreiranju kartice");
    }
  };

  const handleDailyChange = (e) => {
    const { options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => Number(option.value));
    setDailyCardData({ fitnessObjectIds: selectedValues });
  };

  return (
    <div className="guard">
      <div className="guard-hero">
        <div>
          <p className="guard-kicker">FlexFit Redar panel</p>
          <h1>Panel za redare</h1>
          <p className="guard-subtitle">
            Proveri člana i generiši nove kartice.
          </p>
        </div>
      </div>

      <div className="guard-grid">
        <section className="guard-panel">
          <div className="section-heading">
            <span className="section-dot blue"></span>
            <h2>Skeniraj QR kod</h2>
          </div>
          <div className="scanner-box">
            <Scanner
              styles={{
                video: {
                  transform: "scaleX(-1)"
                }
              }}
              onScan={(result) => {
                if (result?.length) {
                  const val = result[0]?.rawValue || "";
                  setQrData(val);

                  const foundCard = cards.find(c => c.cardNumber === val || c.memberId == val);
                  if (foundCard) {
                    const isActive = checkIsCardActive(foundCard);
                    const member = members.find(m => (m.id || m.Id) == foundCard.memberId);
                    const memberName = member ? `${member.firstName} ${member.lastName}` : (foundCard.memberId ? `Član ID: ${foundCard.memberId}` : "Anonimni korisnik");

                    // Fetch member penalties
                    getAllPenaltyCards().then(allPenalties => {
                      const memberPenalties = allPenalties.filter(p => Number(p.memberId) === Number(foundCard.memberId) && !p.isPaid && !p.isCanceled);
                      const totalDebt = memberPenalties.reduce((sum, p) => sum + p.price, 0);

                      const res = {
                        id: foundCard.memberId || foundCard.id,
                        ime: memberName,
                        kartica: foundCard.cardNumber,
                        status: isActive ? "Aktivna" : "Nevažeća / Istekla",
                        objekat: "-",
                        tip: foundCard.validFrom !== undefined ? "Pretplatna" : "Dnevna",
                        debt: totalDebt,
                        unpaidPenalties: memberPenalties
                      };

                      setSearchResult(res);

                      const logPayload = {
                        memberId: res.tip === 'Pretplatna' ? Number(res.id) : 0,
                        fitnessObjectId: 1,
                        cardNumber: res.kartica,
                        cardStatus: isActive ? 'Active' : 'Expired/Invalid',
                        cardType: res.tip,
                        employeeId: getGuaranteedUserId()
                      };
                      console.log("SENDING LOG (QR Scan):", logPayload);
                      logEntry(logPayload).catch(() => { });

                      if (isActive) {
                        setMessage("QR kod uspešno očitan. Ulaz zabeležen.");
                        setError("");
                      } else {
                        setError("Kartica nije važeća, ulaz nije moguć.");
                        setMessage("");
                      }
                    });
                  } else {
                    setSearchResult(null);
                    setError("Kartica nije prepoznata.");

                    // Loguj incident za nepoznat QR
                    const incidentPayload = {
                      memberId: 0,
                      fitnessObjectId: 1,
                      cardNumber: val,
                      cardStatus: 'Unrecognized QR',
                      cardType: 'Unknown',
                      employeeId: getGuaranteedUserId()
                    };
                    console.log("SENDING INCIDENT (QR Scan):", incidentPayload);
                    logEntry(incidentPayload).catch(() => { });
                  }
                }
              }}
              onError={(err) => setError("Kamera nije dostupna.")}
            />
          </div>
          {qrData && <p className="scan-result">Očitano: {qrData}</p>}
        </section>

        {displayedMember ? (
          <section className="guard-result-panel">
            <div className="section-heading">
              <span className="section-dot green"></span>
              <h2>Podaci o članu</h2>
            </div>

            <div className="member-info-container">
              <div className="member-info-header">
                <div className="info-row">
                  <span className="info-label">Ime i prezime: </span>
                  <span className="info-value">{displayedMember.ime}</span>
                </div>
                <div className={`status-badge ${displayedMember.status.includes('Aktivna') ? 'active' : 'inactive'}`}>
                  {displayedMember.status}
                </div>
              </div>


              <div className="info-row">
                <span className="info-label">Broj kartice: </span>
                <span className="info-value">{displayedMember.kartica}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tip: </span>
                <span className="info-value">{displayedMember.tip}</span>
              </div>


            </div>
          </section>
        ) : (
          <div className="guard-panel" style={{ opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderStyle: 'dashed' }}>
            <span className="section-dot" style={{ background: '#64748b', opacity: 0.5, marginBottom: '1rem' }}></span>
            <p style={{ color: '#94a3b8' }}>Prikaz podataka o članu nakon skeniranja ili pretrage.</p>
          </div>
        )}

        <div style={{ gridColumn: "1 / -1" }}>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>

        <section className="guard-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="section-heading">
            <span className="section-dot purple"></span>
            <h2>Brzi ulaz po broju kartice</h2>
          </div>
          <form className="search-box" onSubmit={handleQuickEntry}>
            <input
              type="text"
              placeholder="Unesi broj kartice."
              value={quickEntryValue}
              onChange={(e) => setQuickEntryValue(e.target.value)}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(148, 163, 184, 0.2)", background: "rgba(15, 23, 42, 0.3)", color: "white" }}
            />
            <button type="submit" className="primary-btn">Ulaz</button>
          </form>
        </section>


        <section className="guard-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="section-heading">
            <span className="section-dot purple"></span>
            <h2>Manuelna pretraga i Lista Kartica</h2>
          </div>
          <form className="search-box" onSubmit={handleManualSearch} style={{ marginBottom: "2rem" }}>
            <input
              type="text"
              placeholder="Unesi broj kartice ili ID..."
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
            />
            <button type="submit" className="primary-btn">Pretraži</button>
          </form>

          {manualSearchResult && (
            <div className="manual-result-container" style={{ marginTop: "1rem", border: "1px solid rgba(148, 163, 184, 0.1)", borderRadius: "12px", padding: "1.5rem", background: "rgba(15, 23, 42, 0.4)" }}>
              <div className="section-heading">
                <span className="section-dot green"></span>
                <h3>Rezultat pretrage</h3>
              </div>
              <div className="member-info-container">
                <div className="info-row">
                  <span className="info-label">Ime i prezime: </span>
                  <span className="info-value">{manualSearchResult.ime}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Broj kartice: </span>
                  <span className="info-value">{manualSearchResult.kartica}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status: </span>
                  <span className={`status-badge ${manualSearchResult.status.includes('Aktivna') ? 'active' : 'inactive'}`}>
                    {manualSearchResult.status}
                  </span>
                </div>
              </div>

              {/* DODATO: Dug i kazne za manuelnu pretragu */}
              {manualSearchResult.debt > 0 && (
                <div className="info-row punishment-row" style={{ marginTop: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span className="info-label" style={{ color: "#ef4444", fontWeight: "bold" }}>Ukupan dug: </span>
                    <span className="info-value" style={{ color: "#ef4444", fontSize: "1.2rem", fontWeight: "bold" }}>{manualSearchResult.debt} RSD</span>
                  </div>
                  <div className="unpaid-list">
                    {manualSearchResult.unpaidPenalties?.map(p => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderTop: "1px solid rgba(239, 68, 68, 0.1)" }}>
                        <span style={{ fontSize: "0.85rem", color: "#fca5a5" }}>{new Date(p.date).toLocaleDateString()}: {p.price} RSD</span>
                        <button
                          onClick={() => handlePayPenalty(p.id)}
                          disabled={penaltyLoading}
                          style={{ padding: "4px 10px", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}
                        >
                          {penaltyLoading ? "..." : "Plati"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="member-actions" style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                {!manualSearchResult.status.includes('Aktivna') && (
                  <button
                    onClick={handleExtendMembership}
                    style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Produži
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCards(!showCards)}
            style={{ marginBottom: "1rem", padding: "0.5rem 1rem", backgroundColor: "#334155", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {showCards ? "Sakrij listu kartica" : "Prikaži listu kartica"}
          </button>

          {showCards && (
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Dnevne Kartice (Danas izdato)</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {cards.filter(c => c.purchaseDate && new Date(c.purchaseDate).toLocaleDateString() === new Date().toLocaleDateString()).map(c => (
                    <li key={c.id || c.cardNumber} style={{ padding: '0.75rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{c.cardNumber}</strong>
                      <span style={{ color: '#64748b' }}>Danas</span>
                    </li>
                  ))}
                  {cards.filter(c => c.purchaseDate && new Date(c.purchaseDate).toLocaleDateString() === new Date().toLocaleDateString()).length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nema izdatih dnevnih kartica danas.</p>
                  )}
                </ul>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Pretplatne Kartice</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {cards.filter(c => !c.purchaseDate && c.memberId).map(c => {
                    const member = members.find(m => (m.id || m.Id) == c.memberId);
                    const memberName = member ? `${member.firstName} ${member.lastName}` : `Član ID: ${c.memberId}`;
                    const isValid = c.isActive && c.validTo && new Date(c.validTo) > new Date();
                    return (
                      <li key={c.id || c.cardNumber} style={{ padding: '0.75rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div>
                          <strong>{c.cardNumber}</strong>
                          <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem' }}>{memberName}</span>
                          {c.validTo && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: isValid ? '#4ade80' : '#f87171' }}>
                              {isValid ? `Važi do: ${new Date(c.validTo).toLocaleDateString()}` : `Istekla: ${new Date(c.validTo).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                        {!isValid && (
                          <button
                            onClick={() => extendMembership(c.cardNumber)
                              .then(() => {
                                setMessage(`Članarina za ${memberName} uspešno produžena za 30 dana.`);
                                setError('');
                                getAllMembershipCards().then(data => setCards(Array.isArray(data) ? data : []));
                              })
                              .catch(err => setError(err.message || 'Greška pri produžavanju.'))
                            }
                            style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          >
                            Produži
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {cards.filter(c => !c.purchaseDate && c.memberId).length === 0 && (
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nema pretplatnih kartica sa ID-jem.</p>
                  )}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="guard-grid" style={{ marginTop: "2rem" }}>
        <section className="guard-panel">
          <div className="section-heading">
            <span className="section-dot orange"></span>
            <h2>Nova Dnevna Kartica</h2>
          </div>
          <form className="search-box" onSubmit={handleCreateDailyClick}>
            <select
              name="fitnessObjectIds"
              multiple
              value={dailyCardData.fitnessObjectIds.map(String)}
              onChange={handleDailyChange}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
            >
              {fitnessObjects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
            <button type="submit" style={{ width: "100%" }}>Generiši i Dodeli</button>
          </form>
        </section>

        <section className="guard-panel">
          <div className="section-heading">
            <span className="section-dot green"></span>
            <h2>Nova Pretplatna Kartica</h2>
          </div>
          <form className="search-box" onSubmit={handleCreateSubClick} style={{ flexDirection: "column", gap: "10px" }}>

            <label style={{ display: "flex", gap: "10px", alignItems: "center", alignSelf: "flex-start" }}>
              <input
                type="checkbox"
                checked={subCardData.personalTrainer}
                onChange={(e) => setSubCardData({ ...subCardData, personalTrainer: e.target.checked })}
              />
              Personalni trener (+3000 dinara)
            </label>
            <button type="submit" style={{ width: "100%" }}>Generiši i Dodeli</button>
          </form>
        </section>

        <div style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
          {creationMessage && <p className="success-message">{creationMessage}</p>}
          {creationError && <p className="error-message">{creationError}</p>}
        </div>
      </div>


    </div>
  );
};
export default Guard;