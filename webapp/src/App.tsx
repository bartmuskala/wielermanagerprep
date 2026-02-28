import React, { useState } from 'react';
import { Trophy, CalendarDays, User, TrendingUp, Loader2, X, BarChart3, Medal, LogOut, Plus, Users } from 'lucide-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.tsx';
import { loginWithGoogle, logout } from './firebase.ts';
import './index.css';



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

interface CustomTeam {
  id: string;
  name: string;
  riders: string[]; // up to 20
}

function LandingPage() {
  const navigate = useNavigate();
  const { user, setMockUser } = useAuth();

  // Automatically redirect if logged in
  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      const res = await loginWithGoogle();
      if (res && res.user) {
        setMockUser(res.user);
      }
    } catch (e) {
      console.error("Login failed", e);
    }
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem' }}>
      <Trophy size={80} color="var(--primary-color)" className="animate-fade-in" />
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '0' }}>Wielermanager <span className="text-gradient">Pro</span></h1>
        <p style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginTop: '10px' }}>Simulate exact PCS Top-Competitor Outcomes</p>
      </div>

      <button
        onClick={handleLogin}
        className="glass-panel"
        style={{
          display: 'flex', alignItems: 'center', gap: '15px',
          padding: '1rem 3rem', cursor: 'pointer', fontSize: '1.2rem',
          background: 'var(--primary-color)', color: 'black', border: 'none',
          fontWeight: 'bold', outline: 'none'
        }}>
        <User size={24} />
        Sign in with Google
      </button>
    </div>
  )
}

function RiderModal({ rider, racesMeta, onClose }: { rider: Rider, racesMeta: Record<string, RacesMetadata>, onClose: () => void }) {
  if (!rider) return null;

  const rankedRaces = Object.entries(rider.top_ranks)
    .map(([raceId, rank]) => ({
      raceName: racesMeta[raceId]?.name || raceId,
      date: racesMeta[raceId]?.date || "?",
      rank
    }))
    .sort((a, b) => a.rank - b.rank);

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
            <div style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>Global Database Pool</div>
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
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, setMockUser } = useAuth();
  const navigate = useNavigate();

  const [activeRaceId, setActiveRaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Database State
  const [ridersMeta, setRidersMeta] = useState<Record<string, Rider>>({});
  const [ridersList, setRidersList] = useState<Rider[]>([]); // ALL riders sorted by score
  const [racesMeta, setRacesMeta] = useState<Record<string, RacesMetadata>>({});
  const [racesList, setRacesList] = useState<RacesMetadata[]>([]);

  // Team Modeling State
  const [teams, setTeams] = useState<CustomTeam[]>([{ id: 'default', name: 'My Simulator Team', riders: [] }]);
  const [activeTeamId, setActiveTeamId] = useState<string>('default');

  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:8000';

        // Fetch the raw database of everyone
        const [ridersRes, racesRes] = await Promise.all([
          fetch(`${API_BASE}/api/riders`).then(r => r.json()),
          fetch(`${API_BASE}/api/races`).then(r => r.json())
        ]);

        const rMeta: Record<string, Rider> = {};
        ridersRes.forEach((r: Rider) => rMeta[r.id] = r);
        setRidersMeta(rMeta);
        setRidersList(ridersRes);

        const rcMeta: Record<string, RacesMetadata> = {};
        racesRes.forEach((r: RacesMetadata) => rcMeta[r.id] = r);
        setRacesMeta(rcMeta);
        setRacesList(racesRes);

        if (racesRes.length > 0) setActiveRaceId(racesRes[0].id);

        // Mock load from LocalStorage first instead of forcing Firestore setup
        const localTeams = localStorage.getItem('wielermanager_teams');
        if (localTeams) {
          setTeams(JSON.parse(localTeams));
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch data from backend');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    setMockUser(null);
    navigate('/');
  }

  const saveTeamsToLocal = (updatedTeams: CustomTeam[]) => {
    setTeams(updatedTeams);
    localStorage.setItem('wielermanager_teams', JSON.stringify(updatedTeams));
  };

  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];

  const handleToggleRider = (riderId: string) => {
    const isSelected = activeTeam.riders.includes(riderId);
    let updatedRiders = [...activeTeam.riders];

    if (isSelected) {
      updatedRiders = updatedRiders.filter(id => id !== riderId);
    } else {
      if (updatedRiders.length >= 20) {
        alert("Je ploeg mag maximaal 20 renners bevatten.");
        return;
      }
      updatedRiders.push(riderId);
    }

    const updatedTeams = teams.map(t => t.id === activeTeamId ? { ...t, riders: updatedRiders } : t);
    saveTeamsToLocal(updatedTeams);
  };

  // Calculate Middle Column: The best 12 from the active team
  const evaluateStarters = () => {
    if (!activeRaceId) return [];

    const ourRiders = activeTeam.riders.map(id => ridersMeta[id]).filter(Boolean);
    // Who is actually starting the active race?
    const starters = ourRiders.filter(r => r.starts.includes(activeRaceId));

    // Sort them by their pcs rank for this race
    starters.sort((a, b) => {
      const rankA = a.top_ranks[activeRaceId] || 999;
      const rankB = b.top_ranks[activeRaceId] || 999;
      return rankA - rankB;
    });

    return starters.slice(0, 12).map(r => r.id);
  };

  const current12Starters = evaluateStarters();
  const activeRaceMeta = racesMeta[activeRaceId || ''];

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '2rem' }}>
        <Loader2 className="animate-spin" size={64} color="var(--primary-color)" />
        <h2 className="text-gradient">Loading PCS Database...</h2>
      </div>
    );
  }

  if (error) {
    return <div className="app-container" style={{ color: 'var(--accent-red)' }}>Error: {error}</div>;
  }

  return (
    <div className="app-container" style={{ maxWidth: '100vw' }}>
      {selectedRider && <RiderModal rider={selectedRider} racesMeta={racesMeta} onClose={() => setSelectedRider(null)} />}

      <header className="header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="subtitle">ProCyclingStats Simulator</div>
          <h1>Wielermanager <span className="text-gradient">Pro</span></h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stats-badge">
            <div className="stat-item glass-panel" style={{ padding: '0.5rem 1rem' }}>
              <Users size={16} />
              <span>{user?.displayName || "Sim User"}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="glass-panel" style={{ padding: '0.5rem', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Team Selection Ribbon */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTeamId(t.id)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer',
              background: t.id === activeTeamId ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
              color: t.id === activeTeamId ? 'black' : 'white',
              border: 'none', fontWeight: 'bold'
            }}
          >
            {t.name} ({t.riders.length}/20)
          </button>
        ))}
        <button
          onClick={() => {
            const newId = `team_${Date.now()}`;
            saveTeamsToLocal([...teams, { id: newId, name: `Opslag ${teams.length + 1}`, riders: [] }]);
            setActiveTeamId(newId);
          }}
          style={{ padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', background: 'transparent', border: '1px dashed rgba(255,255,255,0.3)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={16} /> New Team
        </button>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: 'minmax(250px, 1fr) minmax(350px, 1.5fr) minmax(300px, 1.2fr)' }}>
        {/* Races Timeline */}
        <div className="glass-panel animate-fade-in delay-1" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <CalendarDays size={24} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.2rem' }}>Classics Calendar</h2>
          </div>

          <div className="race-timeline">
            {racesList.map(race => {
              // Calculate how many starters this *specific* team has for this race
              const startersCount = activeTeam.riders.filter(id => ridersMeta[id]?.starts.includes(race.id)).length;
              const hasStarters = startersCount > 0;

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
                      <span style={{ fontSize: '0.75rem', color: hasStarters ? 'var(--primary-color)' : 'var(--accent-red)' }}>
                        {hasStarters ? `${Math.min(12, startersCount)} opgesteld` : 'Geen starters uit ploeg'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Race Roster (Middle Column evaluating Custom Team) */}
        <div className="glass-panel animate-fade-in delay-2" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={24} color="var(--primary-color)" />
              <h2 style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>{activeRaceMeta?.name}<br /><span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'normal' }}>Je Team Prognose</span></h2>
            </div>
            <span className="stat-value" style={{ fontSize: '1rem' }}>{current12Starters.length}/12</span>
          </div>

          <div>
            {current12Starters.length === 0 && (
              <div style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>Niemand van deze ploeg start in deze wedstrijd. Test de simulatie door renners rechts toe te voegen.</div>
            )}
            {current12Starters.map((riderId, i) => {
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

        {/* Start Team (Right Column Full Database Market) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in delay-3">
          <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', maxHeight: '75vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <TrendingUp size={24} color="var(--primary-color)" />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.2rem' }}>Ploeg samenstellen</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Klik om toe te voegen aan ({activeTeam.riders.length}/20)</div>
              </div>
            </div>

            {ridersList.map((rider, index) => {
              const inCustomTeam = activeTeam.riders.includes(rider.id);

              return (
                <div
                  key={rider.id}
                  className="rider-card"
                  style={{
                    borderColor: inCustomTeam ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                    background: inCustomTeam ? 'rgba(102, 252, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    marginBottom: '8px'
                  }}
                  onClick={() => handleToggleRider(rider.id)}
                >
                  <div style={{ color: 'var(--text-main)', fontSize: '0.8rem', width: '25px', opacity: 0.5 }}>{index + 1}.</div>
                  <div className="rider-info">
                    <div className="rider-name" style={{ fontSize: '0.95rem', color: inCustomTeam ? 'var(--text-highlight)' : 'var(--text-highlight)' }}>{rider?.name}</div>
                  </div>
                  <div className="rider-price" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.85rem', padding: '0.2rem 0.5rem' }}>
                    {rider?.global_score} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>pts</span>
                  </div>

                  {inCustomTeam && (
                    <div style={{ marginLeft: '10px', color: 'var(--primary-color)' }}>
                      <Medal size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Loader2 className="animate-spin" size={64} color="var(--primary-color)" />
    </div>
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
