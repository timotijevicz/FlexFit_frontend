import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Facilities.css";
import { getAllFitnessObjects } from "../../services/fitnessObjectService";

const Facilities = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Sve");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allCities, setAllCities] = useState(["Sve"]);

  const loadFacilities = async (search = searchTerm, city = selectedCity) => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllFitnessObjects(search, city);
      setFacilities(Array.isArray(data) ? data : []);

      // If we haven't loaded all cities yet, do a one-time fetch or extract from first load
      if (allCities.length === 1 && Array.isArray(data)) {
        const uniqueCities = [...new Set(data.map((item) => item.city).filter(Boolean))];
        setAllCities(["Sve", ...uniqueCities]);
      }
    } catch (err) {
      setError(err.message || "Greška pri učitavanju fitnes centara.");
    } finally {
      setLoading(false);
    }
  };

  // Handle initial load and city changes immediately
  useEffect(() => {
    loadFacilities(searchTerm, selectedCity);
  }, [selectedCity]);

  // Handle searchTerm changes with debounce, skipping the first run if searchTerm is empty
  useEffect(() => {
    if (searchTerm === "") return;

    const delayDebounceFn = setTimeout(() => {
      loadFacilities(searchTerm, selectedCity);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const filteredFacilities = facilities; // Logic moved to backend

  return (
    <div className="facilities">
      <div className="facilities-hero">
        <div>
          <p className="facilities-kicker">FlexFit Objekti</p>
          <h1>Fitnes centri</h1>
          <p className="facilities-subtitle">
            Pregled svih dostupnih FlexFit objekata, sa pretragom po nazivu,
            adresi i gradu.
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={loadFacilities}
          disabled={loading}
        >
          {loading ? "Učitavanje..." : "Osveži"}
        </button>
      </div>

      <div className="facilities-toolbar-card">
        <div className="facilities-toolbar">
          <input
            type="text"
            placeholder="Pretraga po nazivu, gradu ili adresi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {allCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="facilities-error">{error}</p>}

      {loading ? (
        <div className="facilities-state">Učitavanje objekata...</div>
      ) : filteredFacilities.length === 0 ? (
        <div className="facilities-state">Nema pronađenih objekata.</div>
      ) : (
        <div className="facility-list">
          {filteredFacilities.map((obj) => (
            <div className="facility-card" key={obj.id || obj.Id}>
              <div className="facility-card-top">
                <h2>{obj.name}</h2>
                <span className="facility-badge">{obj.city}</span>
              </div>

              <p className="facility-address">📍 {obj.address}</p>

              <div className="facility-info">
                <div className="facility-info-item">
                  <span className="label">Kapacitet</span>
                  <span className="value">{obj.capacity}</span>
                </div>

                <div className="facility-info-item">
                  <span className="label">Radno vreme</span>
                  <span className="value">{obj.workingHours}</span>
                </div>
              </div>

              <button className="details-btn" onClick={() => navigate(`/objekti/${obj.id || obj.Id}`)}>
                Detaljnije
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Facilities;