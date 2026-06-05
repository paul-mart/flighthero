import React, { useState } from 'react';

interface AwardDetails {
  points_required: number;
  taxes_and_fees: number;
  transfer_partners: string[];
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

interface Flight {
  id: number;
  origin: string;
  destination: string;
  departure_date: string;
  carrier: string;
  flight_number: string;
  duration: string;
  stops: number;
  cash_price: number;
  award_details?: AwardDetails;
}

export default function App() {
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');
  const [cabinClass, setCabinClass] = useState('economy');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [searchType, setSearchType] = useState<'cash' | 'points'>('cash');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    const missing: string[] = [];
    if (!trimmedOrigin) missing.push('From');
    if (!trimmedDestination) missing.push('To');
    if (!date) missing.push('Departure date');
    if (tripType === 'round-trip' && !returnDate) missing.push('Return date');

    if (missing.length > 0) {
      setValidationWarning(
        `Please complete all required fields before searching.\n\nMissing: ${missing.join(', ')}`
      );
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        origin: trimmedOrigin,
        destination: trimmedDestination,
        departure_date: date,
        search_type: searchType,
        passengers: String(passengers),
        trip_type: tripType,
        cabin_class: cabinClass,
      });
      if (tripType === 'round-trip') {
        params.set('return_date', returnDate);
      }
      const response = await fetch(`http://localhost:8000/api/search?${params}`);
      const data = await response.json();
      setFlights(data);
    } catch (error) {
      console.error("Error fetching flights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>✈️ FlightHero</h1>
        <p>Find the best routes using cash or credit card transfer points</p>
      </header>

      {/* Search Panel */}
      <div style={styles.searchPanel}>
        <form onSubmit={handleSearch} style={styles.form}>
          <div style={styles.optionsRow}>
            <div style={{ ...styles.inputGroup, ...styles.passengerGroup }}>
              <div style={{ ...styles.label, ...styles.passengerLabel }} title="Passengers">
                <PersonIcon />
              </div>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                style={{ ...styles.select, ...styles.passengerSelect }}
                aria-label="Passengers"
              >
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Trip</label>
              <select
                value={tripType}
                onChange={(e) => {
                  const value = e.target.value as 'one-way' | 'round-trip';
                  setTripType(value);
                  if (value === 'one-way') setReturnDate('');
                }}
                style={styles.select}
              >
                <option value="round-trip">Round trip</option>
                <option value="one-way">One way</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Class</label>
              <select
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                style={styles.select}
              >
                <option value="economy">Economy</option>
                <option value="premium-economy">Premium economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>From</label>
            <input 
              type="text" 
              placeholder="e.g. JFK" 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)} 
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>To</label>
            <input 
              type="text" 
              placeholder="e.g. LAX" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Depart</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => {
                setDate(e.target.value);
                if (returnDate && e.target.value && returnDate < e.target.value) {
                  setReturnDate('');
                }
              }}
              style={styles.input}
            />
          </div>

          {tripType === 'round-trip' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Return</label>
              <input
                type="date"
                value={returnDate}
                min={date || undefined}
                onChange={(e) => setReturnDate(e.target.value)}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Search Mode</label>
            <div style={styles.toggleGroup}>
              <button 
                type="button"
                onClick={() => setSearchType('cash')}
                style={{...styles.toggleBtn, ...(searchType === 'cash' ? styles.activeToggle : {})}}
              >
                💵 Cash
              </button>
              <button 
                type="button"
                onClick={() => setSearchType('points')}
                style={{...styles.toggleBtn, ...(searchType === 'points' ? styles.activeToggle : {})}}
              >
                💳 Points
              </button>
            </div>
          </div>

          <button type="submit" style={styles.searchBtn}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      <main style={styles.resultsContainer}>
        {flights.length > 0 ? (
          flights.map((flight) => (
            <div key={flight.id} style={styles.flightCard}>
              <div style={styles.flightInfo}>
                <div style={styles.carrierBadge}>{flight.carrier}</div>
                <div style={styles.routeDetails}>
                  <strong>{flight.origin} → {flight.destination}</strong>
                  <span style={styles.subtext}>{flight.duration} • {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop`}</span>
                </div>
              </div>

              <div style={styles.pricingSection}>
                {searchType === 'cash' ? (
                  <div style={styles.priceText}>${flight.cash_price}</div>
                ) : (
                  flight.award_details && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={styles.pointsText}>
                        {flight.award_details.points_required.toLocaleString()} pts
                      </div>
                      <div style={styles.subtext}>+ ${flight.award_details.taxes_and_fees} fees</div>
                      <div style={styles.partnerContainer}>
                        {flight.award_details.transfer_partners.map((p, i) => (
                          <span key={i} style={styles.partnerTag}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        ) : (
          !loading && <div style={styles.emptyState}>Enter your route details above to explore options.</div>
        )}
      </main>

      {validationWarning && (
        <div
          style={styles.modalOverlay}
          onClick={() => setValidationWarning(null)}
          role="presentation"
        >
          <div
            style={styles.modal}
            role="alertdialog"
            aria-labelledby="validation-title"
            aria-describedby="validation-message"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="validation-title" style={styles.modalTitle}>Missing information</h2>
            <p id="validation-message" style={styles.modalMessage}>
              {validationWarning.split('\n\n').map((part, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {part}
                </span>
              ))}
            </p>
            <button
              type="button"
              style={styles.modalBtn}
              onClick={() => setValidationWarning(null)}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldFont: React.CSSProperties = {
  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: '14px',
  fontWeight: 400,
  color: '#3c4043',
  letterSpacing: '0.01em',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    color: '#3c4043',
  },
  header: { textAlign: 'center', marginBottom: '40px' },
  searchPanel: {
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 24px rgba(26, 115, 232, 0.08), 0 1px 3px rgba(60, 64, 67, 0.06)',
  },
  form: { display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' },
  optionsRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', marginBottom: '4px', alignItems: 'flex-end' },
  inputGroup: { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '150px' },
  label: { fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#5f6368', letterSpacing: '0.02em' },
  input: {
    ...fieldFont,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #dadce0',
    background: '#fff',
    height: '42px',
  },
  select: {
    ...fieldFont,
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #dadce0',
    background: '#fff',
    height: '42px',
    cursor: 'pointer',
  },
  passengerGroup: { flex: '0 0 auto', minWidth: '72px' },
  passengerLabel: { display: 'flex', alignItems: 'center', color: '#888' },
  passengerSelect: {
    width: '72px',
    minWidth: '72px',
    padding: '10px 24px 10px 12px',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  toggleGroup: { display: 'flex', border: '1px solid #dadce0', borderRadius: '8px', overflow: 'hidden' },
  toggleBtn: { ...fieldFont, flex: 1, padding: '10px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 500 },
  activeToggle: { background: '#1a73e8', color: '#fff' },
  searchBtn: {
    ...fieldFont,
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    height: '42px',
  },
  resultsContainer: { marginTop: '30px' },
  flightCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.92)',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid rgba(218, 220, 224, 0.8)',
    marginBottom: '12px',
    boxShadow: '0 2px 12px rgba(26, 115, 232, 0.06)',
  },
  flightInfo: { display: 'flex', gap: '20px', alignItems: 'center' },
  carrierBadge: { background: '#eef2f7', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '14px' },
  routeDetails: { display: 'flex', flexDirection: 'column', gap: '4px' },
  subtext: { fontSize: '13px', color: '#666' },
  pricingSection: { display: 'flex', alignItems: 'center' },
  priceText: { fontSize: '24px', fontWeight: 500, color: '#2e7d32' },
  pointsText: { fontSize: '22px', fontWeight: 500, color: '#1a73e8' },
  partnerContainer: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'flex-end' },
  partnerTag: { fontSize: '10px', background: '#e1f5fe', color: '#0288d1', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 },
  emptyState: { textAlign: 'center', padding: '40px', color: '#888' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: { margin: '0 0 12px', fontSize: '20px', color: '#c62828' },
  modalMessage: { margin: '0 0 20px', lineHeight: 1.5, color: '#444' },
  modalBtn: {
    ...fieldFont,
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
};