import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFitnessObjectById } from "../../services/fitnessObjectService";
import { apiFetch } from "../../services/api";
import { useAppContext } from "../../context/useAppContext";
import "./FacilityDetails.css";

const RESOURCE_TYPES = ["Kardio", "Tegovi", "Grupna sala"];
const RESOURCE_STATUS = ["Slobodan", "Zauzet", "U kvaru"];

const FacilityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId, isMember, isAdmin, isEmployee } = useAppContext();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookMessage, setBookMessage] = useState("");
  const [showAddResource, setShowAddResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({ type: 0, status: 0, floor: 1, isPremium: false, premiumFee: 0 });
  const [reservationTimes, setReservationTimes] = useState({});
  const [reservationsList, setReservationsList] = useState({});
  const [timeSlots, setTimeSlots] = useState({});
  const [newSlotTimes, setNewSlotTimes] = useState({});

  const handleStartTimeChange = (resId, startVal) => {
    if (!startVal) {
      setReservationTimes(prev => ({ ...prev, [resId]: { ...prev[resId], startTime: startVal } }));
      return;
    }
    const sTime = new Date(startVal);
    sTime.setMinutes(sTime.getMinutes() + 30);
    // local time format "YYYY-MM-DDTHH:mm" for input type datetime-local
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const eVal = new Date(sTime - tzoffset).toISOString().slice(0, 16);

    setReservationTimes(prev => ({ ...prev, [resId]: { ...prev[resId], startTime: startVal, endTime: eVal } }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getFitnessObjectById(id);
      setFacility(data);

      if (data && data.resources) {
        const reservationsData = {};
        for (const res of data.resources) {
          try {
            const resData = await apiFetch(`/api/Reservations/resource/${res.id}`);
            reservationsData[res.id] = Array.isArray(resData) ? resData : [];
          } catch (e) {
            console.error("Error fetching reservations for resource", res.id, e);
            reservationsData[res.id] = [];
          }
          try {
            const slotsData = await apiFetch(`/api/TimeSlots/${res.id}`);
            setTimeSlots(prev => ({ ...prev, [res.id]: slotsData }));
          } catch (e) {
            console.error("Error fetching timeslots", e);
          }
        }
        setReservationsList(reservationsData);
      }
    } catch (err) {
      setError(err.message || "Greška pri učitavanju detalja objekta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/Resources/create", {
        method: "POST",
        body: JSON.stringify({ ...resourceForm, fitnessObjectId: Number(id) })
      });
      setBookMessage("Sprava uspešno dodata!");
      setShowAddResource(false);
      loadData();
    } catch (err) {
      setBookMessage("Greška pri dodavanju sprave: " + err.message);
    }
  };
  if (loading) return <div className="facility-details-state">Učitavanje...</div>;
  if (error) return <div className="facility-details-error">{error}</div>;
  if (!facility) return <div className="facility-details-state">Objekat nije pronađen.</div>;

  return (
    <div className="facility-details">
      <button className="back-btn" onClick={() => navigate("/objekti")}>← Nazad na objekte</button>

      <div className="facility-header">
        <h1>{facility.name}</h1>
        <p className="facility-address">📍 {facility.address}, {facility.city}</p>
        <p>Radno vreme: {facility.workingHours} | Kapacitet: {facility.capacity}</p>
        {bookMessage && <div style={{ marginTop: '1rem', color: '#4ade80', fontWeight: 'bold' }}>{bookMessage}</div>}
      </div>

      <div className="resources-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Sprave i Resursi</h2>
          {(isAdmin || isEmployee) && (
            <button
              onClick={() => setShowAddResource(!showAddResource)}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showAddResource ? "Odustani" : "+ Dodaj spravu"}
            </button>
          )}
        </div>

        {showAddResource && (
          <form onSubmit={handleAddResource} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#1e293b', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                Tip Sprave:
                <select value={resourceForm.type} onChange={(e) => setResourceForm({ ...resourceForm, type: Number(e.target.value) })} style={{ padding: '0.5rem', borderRadius: '4px', border: 'none' }}>
                  <option value="0">Kardio</option>
                  <option value="1">Tegovi</option>
                  <option value="2">Grupna sala</option>
                </select>
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                Status:
                <select value={resourceForm.status} onChange={(e) => setResourceForm({ ...resourceForm, status: Number(e.target.value) })} style={{ padding: '0.5rem', borderRadius: '4px', border: 'none' }}>
                  <option value="0">Slobodan</option>
                  <option value="1">Zauzet</option>
                  <option value="2">U kvaru</option>
                </select>
              </label>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                Nivo / Sprat:
                <input type="number" value={resourceForm.floor} onChange={(e) => setResourceForm({ ...resourceForm, floor: Number(e.target.value) })} style={{ padding: '0.5rem', borderRadius: '4px', border: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={resourceForm.isPremium} onChange={(e) => setResourceForm({ ...resourceForm, isPremium: e.target.checked })} />
                Premium Zona
              </label>
              {resourceForm.isPremium && (
                <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  Doplata (RSD):
                  <input type="number" value={resourceForm.premiumFee} onChange={(e) => setResourceForm({ ...resourceForm, premiumFee: Number(e.target.value) })} style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', maxWidth: '100px' }} />
                </label>
              )}
            </div>
            <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Sačuvaj spravu
            </button>
          </form>
        )}
        {(!facility.resources || facility.resources.length === 0) ? (
          <p className="no-resources">Ovaj objekat trenutno nema evidentiranih sprava.</p>
        ) : (
          <div className="resources-grid">
            {facility.resources.map(res => (
              <div key={res.id} className={`resource-card status-${res.status}`}>
                <div className="resource-top">
                  <h3>{RESOURCE_TYPES[res.type] || "Nepoznato"} (ID: {res.id})</h3>
                  <span className={`status-badge status-${res.status}`}>
                    {RESOURCE_STATUS[res.status] || "Nepoznato"}
                  </span>
                </div>
                <div className="resource-info">
                  <p><strong>Nivo/Sprat:</strong> {res.floor}</p>
                  {res.isPremium && (
                    <div className="premium-badge">
                      ⭐️ Premium Zona (Doplata: {res.premiumFee} RSD)
                    </div>
                  )}

                  {(res.status === 1) && (isAdmin || isEmployee) && (
                    <button
                      onClick={async () => {
                        try {
                          await apiFetch(`/api/Reservations/mark-no-show/${res.id}`, { method: "POST" });
                          setBookMessage("Kazna primenjena za nepojavljivanje na spravi " + res.id);
                          loadData();
                        } catch (err) {
                          setBookMessage("Greška pri pisanju kazne: " + err.message);
                        }
                      }}
                      style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Upiši kaznu (Neiskorišćeno)
                    </button>
                  )}

                  {/* Dostupni Termini za sve sprave */}
                  {true && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                      <h4 style={{ marginBottom: '0.5rem', color: '#fcd34d' }}>Dostupni Termini</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {(timeSlots[res.id] || []).map(slot => {
                          const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                          const startLoc = new Date(new Date(slot.startTime) - tzoffset).toISOString().slice(0, 16);
                          const endLoc = new Date(new Date(slot.endTime) - tzoffset).toISOString().slice(0, 16);
                          const isSelected = reservationTimes[res.id]?.startTime === startLoc;
                          const maxCapacity = res.type === 2 ? 10 : 5;
                          const available = slot.availableSpots !== undefined ? slot.availableSpots : maxCapacity;
                          const noSpots = available <= 0;
                          
                          const userBooking = reservationsList[res.id]?.find(r => 
                            r.memberId === Number(userId) && 
                            new Date(r.startTime).getTime() === new Date(slot.startTime).getTime() &&
                            r.status !== 'Canceled'
                          );
                          const userAlreadyBooked = !!userBooking;

                          return (
                            <button
                              key={slot.id}
                              disabled={noSpots && !userAlreadyBooked}
                              onClick={async () => {
                                if (userAlreadyBooked) {
                                  if (window.confirm("Da li želite da otkažete svoju rezervaciju za ovaj termin?")) {
                                    try {
                                      await apiFetch(`/api/Reservations/cancel/${userBooking.id}`, { method: "DELETE" });
                                      setBookMessage("Uspešno ste otkazali rezervaciju.");
                                      loadData();
                                    } catch (err) {
                                      setBookMessage("Greška pri otkazivanju: " + err.message);
                                    }
                                  }
                                } else {
                                  setReservationTimes(prev => ({ ...prev, [res.id]: { startTime: startLoc, endTime: endLoc } }));
                                }
                              }}
                              style={{
                                background: isSelected ? '#10b981' : (userAlreadyBooked ? '#eab308' : (noSpots ? '#475569' : '#334155')),
                                color: (userAlreadyBooked || isSelected) ? '#0f172a' : '#e2e8f0',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #475569',
                                cursor: (noSpots && !userAlreadyBooked) ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              {slot.startTime.substring(8, 10)}.{slot.startTime.substring(5, 7)}. | {slot.startTime.substring(11, 16)} - {slot.endTime.substring(11, 16)}
                              <br />
                              <span style={{ fontSize: '0.75rem', color: userAlreadyBooked ? '#854d0e' : (noSpots ? '#fca5a5' : '#bae6fd'), fontWeight: userAlreadyBooked ? 'bold' : 'normal' }}>
                                {userAlreadyBooked ? 'Već rezervisano' : (noSpots ? 'Popunjeno' : `Slobodno mesta: ${available}`)}
                              </span>
                            </button>
                          );
                        })}
                        {(!timeSlots[res.id] || timeSlots[res.id].length === 0) && (
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Nema predloženih termina.</span>
                        )}
                      </div>

                      {userId && res.status === 0 && reservationTimes[res.id]?.startTime && (
                        <button
                          onClick={async () => {
                            const times = reservationTimes[res.id];
                            const sTime = new Date(times.startTime);
                            const eTime = new Date(times.endTime);
                            try {
                              setBookMessage("Zakazivanje u toku...");
                              await apiFetch("/api/Reservations/book", {
                                method: "POST",
                                body: JSON.stringify({ memberId: Number(userId), resourceId: res.id, startTime: sTime.toISOString(), endTime: eTime.toISOString() })
                              });
                              setBookMessage(`Uspešno ste zakazali termin: ${RESOURCE_TYPES[res.type] || "Sprava"}!`);
                              setReservationTimes(prev => ({ ...prev, [res.id]: { startTime: "", endTime: "" } }));
                              loadData();
                            } catch (err) {
                              setBookMessage("Greška pri zakazivanju: " + err.message);
                            }
                          }}
                          style={{ padding: '0.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '1rem' }}
                        >
                          Zakaži izabrani termin
                        </button>
                      )}


                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityDetails;