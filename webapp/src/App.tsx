import { useState, useEffect } from 'react';
import { Trophy, CalendarDays, User, TrendingUp, Loader2, X, BarChart3, HelpCircle, Medal } from 'lucide-react';
import './index.css';

interface Race {
  race_id: string;
  selected: string[];
}

interface Rider {
  id: string;
  name: string;
  global_score: number;
  starts: string[];
  top_ranks: Record<string, number>;
}

interface RacesMetadata {
  id: string;
  name: string;
  date: string;
  class: string;
}

function RiderModal({ rider, racesMeta, onClose }: { rider: Rider, racesMeta: Record<string, RacesMetadata>, onClose: () => void }) {
  if (!rider) return null;

  // Find all races where the rider is a top competitor
  const rankedRaces = Object.entries(rider.top_ranks)
    .map(([raceId, rank]) => ({
      raceName: racesMeta[raceId]?.name || raceId,
      date: racesMeta[raceId]?.date || "?",
      rank
    }))
    .sort((a, b) => a.rank - b.rank); // Sort by best rank

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div className="glass-panel" onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', padding: '2rem'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer'
        }}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div className="rider-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
            <User size={40} />
          </div>
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>{rider.name}</h2>
            <div style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>Ultimate 30-Man Squad</div>
          </div>
        </div>

        <div style={{ background: 'rgba(102, 252, 241, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BarChart3 size={32} color="var(--primary-color)" />
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Global Competitor Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-highlight)' }}>{rider.global_score} pts</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Medal size={20} color="var(--primary-color)" />
            PCS Top Competitor Rankings
          </h3>

          {rankedRaces.length === 0 ? (
            <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>Geen 'Top Competitor' rangschikking gevonden (maar staat wel op startlijsten).</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rankedRaces.map((rr, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--text-highlight)', fontWeight: 'bold', display: 'block' }}>{rr.raceName}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{rr.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    #{rr.rank}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.8, textAlign: 'center' }}>
          Riders score points towards their <b>Global Score</b> based on their rank in official ProCyclingStats "Top Competitors" lists (e.g. Rank #1 earns 100 points).
        </div>

      </div>
    </div>
  );
}


function App() {
  const [activeRaceId, setActiveRaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [squadRiders, setSquadRiders] = useState<string[]>([]);
  const [solutionRaces, setSolutionRaces] = useState<Race[]>([]);
  const [ridersMeta, setRidersMeta] = useState<Record<string, Rider>>({});
  const [racesMeta, setRacesMeta] = useState<Record<string, RacesMetadata>>({});
  const [racesList, setRacesList] = useState<RacesMetadata[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const [ridersRes, racesRes] = await Promise.all([
          fetch(`${API_BASE}/api/riders`).then(r => r.json()),
          fetch(`${API_BASE}/api/races`).then(r => r.json())
        ]);

        const rMeta: Record<string, Rider> = {};
        ridersRes.forEach((r: Rider) => rMeta[r.id] = r);
        setRidersMeta(rMeta);

        const rcMeta: Record<string, RacesMetadata> = {};
        racesRes.forEach((r: RacesMetadata) => rcMeta[r.id] = r);
        setRacesMeta(rcMeta);
        setRacesList(racesRes);

        if (racesRes.length > 0) setActiveRaceId(racesRes[0].id);

        const solveRes = await fetch(`${API_BASE}/api/solve`, { method: 'POST' }).then(r => r.json());

        if (solveRes.error) {
          setError(solveRes.error);
        } else {
          setSquadRiders(solveRes.squad_riders);
          setSolutionRaces(solveRes.races);
          setTotalPoints(solveRes.total_points);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data from backend');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}>
        <Loader2 className="animate-spin" size={64} color="var(--primary-color)" />
        <h2 className="text-gradient">Scraping 'Top Competitors' Data...</h2>
        <p style={{ color: 'var(--text-main)', textAlign: 'center', maxWidth: '400px' }}>
          De AI verzamelt prognoses voor {racesList.length || 25} klassiekers en berekent de ultieme 30-koppige selectie.
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="app-container" style={{ color: 'var(--accent-red)' }}>Error: {error}</div>;
  }

  const activeRaceData = solutionRaces.find(r => r.race_id === activeRaceId);
  const activeRaceMeta = racesMeta[activeRaceId || ''];

  // The squad is inherently the top 30
  const sortedSquad = [...squadRiders];

  return (
    <div className="app-container">
      {selectedRider && <RiderModal rider={selectedRider} racesMeta={racesMeta} onClose={() => setSelectedRider(null)} />}

      <header className="header animate-fade-in">
        <div>
          <div className="subtitle">ProCyclingStats AI Predictions</div>
          <h1>TopCompetitors <span className="text-gradient">Suggester</span></h1>
          <div style={{ color: 'var(--primary-dark)', fontSize: '0.9rem', marginTop: '5px' }}>The Ultimate 30-Man Spring Roster</div>
        </div>

        <div className="stats-badge">
          <div className="stat-item glass-panel" style={{ padding: '0.5rem 1rem' }}>
            <span className="stat-label">Total Global Score</span>
            <span className="stat-value">{totalPoints} <span style={{ fontSize: '0.8rem', color: '#c5c6c7' }}>pts</span></span>
          </div>
          <div className="stat-item glass-panel" style={{ padding: '0.5rem 1rem' }}>
            <span className="stat-label">Selectie</span>
            <span className="stat-value">{squadRiders.length} <span style={{ fontSize: '0.8rem', color: '#c5c6c7' }}>renners</span></span>
          </div>
        </div>
      </header>

      <div className="grid-3">
        {/* Races Timeline */}
        <div className="glass-panel animate-fade-in delay-1" style={{ gridColumn: '1 / 2', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <CalendarDays size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.2rem' }}>Spring Classics 2026</h2>
          </div>

          <div className="race-timeline">
            {racesList.map(race => {
              const raceData = solutionRaces.find(r => r.race_id === race.id);
              const hasStarters = raceData && raceData.selected.length > 0;
              return (
                <div
                  key={race.id}
                  className={`race-item ${activeRaceId === race.id ? 'active' : ''}`}
                  onClick={() => setActiveRaceId(race.id)}
                  style={{ padding: '0.8rem 1rem' }}
                >
                  <div className="race-name" style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.95rem' }}>{race.name}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>{race.date} • {race.class}</span>
                      {!hasStarters && <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>Geen starters</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Race Roster */}
        <div className="glass-panel animate-fade-in delay-2" style={{ gridColumn: '2 / 3', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={24} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>{activeRaceMeta?.name}<br /><span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'normal' }}>Starters & AI Favorieten</span></h2>
            </div>
            <span className="stat-value" style={{ fontSize: '1rem' }}>{(activeRaceData?.selected?.length) || 0}/12</span>
          </div>

          <div>
            {!activeRaceData?.selected?.length && (
              <div style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>Geen renners uit je selectie starten in deze wedstrijd.</div>
            )}
            {activeRaceData?.selected.map((riderId, i) => {
              const rider = ridersMeta[riderId];
              const raceRank = rider?.top_ranks?.[activeRaceId || ''];

              return (
                <div
                  key={riderId}
                  className="rider-card"
                  style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => setSelectedRider(rider)}
                >
                  {/* Subtle golden background if they are Top 3 favorite */}
                  {raceRank && raceRank <= 3 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: raceRank === 1 ? '#FFD700' : raceRank === 2 ? '#C0C0C0' : '#CD7F32' }} />
                  )}

                  <div className="rider-avatar">
                    <User size={24} />
                  </div>
                  <div className="rider-info">
                    <div className="rider-name">{rider?.name || 'Onbekend'}</div>
                    <div className="rider-team" style={{ gap: '10px' }}>
                      <span style={{ color: 'var(--primary-color)' }}>Global score: {rider?.global_score}</span>
                    </div>
                  </div>

                  {raceRank ? (
                    <div style={{
                      fontSize: '0.9rem',
                      background: raceRank === 1 ? 'linear-gradient(45deg, #FFD700, #FDB931)' : 'rgba(102, 252, 241, 0.1)',
                      color: raceRank === 1 ? '#000' : 'var(--text-highlight)',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      border: raceRank === 1 ? 'none' : '1px solid var(--primary-color)'
                    }}>
                      #{raceRank} PCS Favoriet
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                      Niet gerangschikt
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in delay-3">
          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <TrendingUp size={24} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.2rem' }}>De 30-Man Roster</h2>
            </div>

            {sortedSquad.map((riderId, index) => {
              const rider = ridersMeta[riderId];
              const isStarting = activeRaceData?.selected.includes(riderId);

              return (
                <div
                  key={riderId}
                  className="rider-card"
                  style={{
                    borderColor: isStarting ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem'
                  }}
                  onClick={() => setSelectedRider(rider)}
                >
                  <div style={{ color: 'var(--text-main)', fontSize: '0.8rem', width: '20px' }}>{index + 1}.</div>
                  <div className="rider-info">
                    <div className="rider-name" style={{ fontSize: '0.95rem', color: isStarting ? 'var(--text-highlight)' : 'var(--text-highlight)' }}>{rider?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: isStarting ? 'var(--primary-color)' : 'var(--text-main)' }}>
                      {isStarting ? "Start vandaag" : "-"}
                    </div>
                  </div>
                  <div className="rider-price" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.85rem', padding: '0.2rem 0.5rem' }}>
                    {rider?.global_score} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
