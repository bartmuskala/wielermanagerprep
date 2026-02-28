import React, { useState } from 'react';
import { Trophy, CalendarDays, User, TrendingUp, Loader2, X, BarChart3, Medal, LogOut, Plus, Users } from 'lucide-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import './index.css';



interface Rider {
  id: string;
  name: string;
  global_score: number;
  starts: string[];
  top_ranks: Record<string, number>;
  sporza_price?: number;
  sporza_popularity?: number;
  roi?: number;
  team?: string;
  team_logo?: string;
  expertises?: Record<string, number>;
  historic_results?: string[];
}

interface RacesMetadata {
  id: string;
  name: string;
  date: string;
  class: string;
  is_completed?: boolean;
  actual_results?: Record<string, { rank: number; points: number }>;
}

interface CustomTeam {
  id: string;
  name: string;
  riders: string[]; // up to 20
}

function LandingPage() {
  const navigate = useNavigate();
  const handleLoginSuccess = (credentialResponse: any) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      localStorage.setItem("google_user", JSON.stringify(decoded));
      navigate('/dashboard');
    } catch (e) {
      console.error("Login verification failed", e);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem' }}>
      <Trophy size={80} color="var(--primary-color)" className="animate-fade-in" />
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '0' }}>Wielermanager <span className="text-gradient">Pro</span></h1>
        <p style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginTop: '10px' }}>Simulate exact PCS Top-Competitor Outcomes</p>
      </div>

      <div className="animate-fade-in delay-1" style={{ marginTop: '20px' }}>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={() => console.log('Login Failed')}
          theme="filled_black"
          size="large"
          shape="pill"
        />
      </div>
    </div>
  )
}

function TeamLogo({ teamName, logoUrl, size = 32 }: { teamName?: string, logoUrl?: string, size?: number }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={teamName || "Team"} style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }} title={teamName} />;
  }
  if (!teamName) return <User size={size} />;
  const initials = teamName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'var(--primary-color)', color: 'black',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: `${size / 2.5}px`
    }} title={teamName}>
      {initials}
    </div>
  );
}

function RiderModal({ rider, racesMeta, onClose }: { rider: Rider, racesMeta: Record<string, RacesMetadata>, onClose: () => void }) {
  if (!rider) return null;
  const [activeTab, setActiveTab] = useState<'expertises' | 'upcoming' | 'historic'>('expertises');

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
          <TeamLogo teamName={rider.team} logoUrl={rider.team_logo} size={64} />
          <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>{rider.name}</h2>
            <div style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{rider.team || 'Global Database Pool'}</div>
          </div>
        </div>

        <div style={{ background: 'rgba(102, 252, 241, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BarChart3 size={32} color="var(--primary-color)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Global Competitor Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-highlight)' }}>{rider.global_score} pts</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Sporza Prijs</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>€{rider.sporza_price || 0}M</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setActiveTab('expertises')} style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: activeTab === 'expertises' ? 'var(--primary-color)' : 'white', fontWeight: activeTab === 'expertises' ? 'bold' : 'normal', borderBottom: activeTab === 'expertises' ? '2px solid var(--primary-color)' : 'none', cursor: 'pointer' }}>Expertise</button>
          <button onClick={() => setActiveTab('upcoming')} style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: activeTab === 'upcoming' ? 'var(--primary-color)' : 'white', fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal', borderBottom: activeTab === 'upcoming' ? '2px solid var(--primary-color)' : 'none', cursor: 'pointer' }}>Verwachte Rankings</button>
          <button onClick={() => setActiveTab('historic')} style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: activeTab === 'historic' ? 'var(--primary-color)' : 'white', fontWeight: activeTab === 'historic' ? 'bold' : 'normal', borderBottom: activeTab === 'historic' ? '2px solid var(--primary-color)' : 'none', cursor: 'pointer' }}>Erelijst</button>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', minHeight: '200px' }}>
          {activeTab === 'expertises' && (
            <div>
              {rider.expertises && Object.keys(rider.expertises).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(rider.expertises).sort((a, b) => b[1] - a[1]).map(([exp, val]: any) => (
                    <div key={exp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{exp}</span>
                      <span style={{ color: 'var(--primary-color)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>Geen expertise scores beschikbaar.</div>}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div>
              {rankedRaces.length === 0 ? (
                <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>Geen 'Top Competitor' rangschikking gevonden.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {rankedRaces.map((rr, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--text-highlight)', fontWeight: 'bold' }}>{rr.raceName}</span>
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
          )}

          {activeTab === 'historic' && (
            <div>
              {rider.historic_results && rider.historic_results.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {rider.historic_results.map((res, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '1rem', color: 'var(--text-highlight)' }}>
                      {res}
                    </li>
                  ))}
                </ul>
              ) : <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>Geen historische resultaten beschikbaar.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const rawUser = localStorage.getItem("google_user");
    if (rawUser) {
      setUser(JSON.parse(rawUser));
    } else {
      navigate('/');
    }
  }, [navigate]);

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
  const [activeTeamId, setActiveTeamId] = useState<string>('overview');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  // Filters & Sorting State
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [maxBudget, setMaxBudget] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState("score_desc"); // "budget_desc", "budget_asc", "score_desc", "roi_desc", "race_desc"

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
        const rawUser = localStorage.getItem("google_user");
        let userId = "default";
        if (rawUser) {
          userId = JSON.parse(rawUser).sub || "default";
        }
        const localTeams = localStorage.getItem(`wielermanager_teams_${userId}`);
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
    localStorage.removeItem("google_user");
    setUser(null);
    navigate('/');
  }

  const saveTeamsToLocal = (updatedTeams: CustomTeam[]) => {
    setTeams(updatedTeams);
    const userId = user?.sub || "default";
    localStorage.setItem(`wielermanager_teams_${userId}`, JSON.stringify(updatedTeams));
  };

  const handleDeleteTeam = (tId: string) => {
    if (teams.length <= 1) return alert("Je moet minstens 1 team behouden.");
    if (confirm("Zeker dat je dit team wil verwijderen?")) {
      const newTeams = teams.filter(t => t.id !== tId);
      saveTeamsToLocal(newTeams);
      if (activeTeamId === tId) setActiveTeamId('overview');
    }
  }

  const handleRenameSubmit = (tId: string) => {
    if (editingName.trim()) {
      saveTeamsToLocal(teams.map(t => t.id === tId ? { ...t, name: editingName.trim() } : t));
    }
    setEditingTeamId(null);
  }

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

      const currentBudget = updatedRiders.reduce((sum, id) => sum + (ridersMeta[id]?.sporza_price || 0), 0);
      const riderPrice = ridersMeta[riderId]?.sporza_price || 0;
      if (currentBudget + riderPrice > 120) {
        alert(`Budget overschreden! Deze renner kost €${riderPrice}M, maar je hebt nog maar €${120 - currentBudget}M over.`);
        return;
      }

      updatedRiders.push(riderId);
    }

    const updatedTeams = teams.map(t => t.id === activeTeamId ? { ...t, riders: updatedRiders } : t);
    saveTeamsToLocal(updatedTeams);
  };

  const teamSpent = activeTeam.riders.reduce((sum, id) => sum + (ridersMeta[id]?.sporza_price || 0), 0);
  const teamRemaining = 120 - teamSpent;

  // Calculate Middle Column: The best 12 from the active team
  const evaluateStarters = () => {
    if (!activeRaceId) return [];

    const ourRiders = activeTeam.riders.map(id => ridersMeta[id]).filter(Boolean);
    // Who is actually starting the active race?
    const starters = ourRiders.filter(r => r.starts.includes(activeRaceId));
    const raceMeta = racesMeta[activeRaceId];

    if (raceMeta?.is_completed && raceMeta.actual_results) {
      // If completed, sort by who actually scored the highest Sporza points
      starters.sort((a, b) => {
        const ptsA = raceMeta.actual_results![a.id]?.points || 0;
        const ptsB = raceMeta.actual_results![b.id]?.points || 0;
        return ptsB - ptsA;
      });
    } else {
      // Sort them by their pcs rank for this race
      starters.sort((a, b) => {
        const rankA = a.top_ranks[activeRaceId] || 999;
        const rankB = b.top_ranks[activeRaceId] || 999;
        return rankA - rankB;
      });
    }

    return starters.slice(0, 12).map(r => r.id);
  };

  const current12Starters = evaluateStarters();
  const activeRaceMeta = racesMeta[activeRaceId || ''];

  const processedRiders = React.useMemo(() => {
    let filtered = ridersList;

    if (searchTerm.trim()) {
      filtered = filtered.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (teamFilter !== "All Teams") {
      filtered = filtered.filter(r => r.team === teamFilter);
    }

    if (maxBudget !== "All") {
      filtered = filtered.filter(r => (r.sporza_price || 0) <= maxBudget);
    }

    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortBy === "budget_desc") return (b.sporza_price || 0) - (a.sporza_price || 0);
      if (sortBy === "budget_asc") return (a.sporza_price || 0) - (b.sporza_price || 0);
      if (sortBy === "roi_desc") return (b.roi || 0) - (a.roi || 0);
      if (sortBy === "race_desc" && activeRaceId) {
        const rankA = a.top_ranks?.[activeRaceId] || 999;
        const rankB = b.top_ranks?.[activeRaceId] || 999;
        return rankA - rankB; // Lower rank is better
      }
      return (b.global_score || 0) - (a.global_score || 0); // score_desc default
    });

    return arr;
  }, [ridersList, searchTerm, teamFilter, maxBudget, sortBy, activeRaceId]);

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
              <span>{user?.name || user?.given_name || "Sim User"}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="glass-panel" style={{ padding: '0.5rem', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Team Selection Ribbon */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTeamId('overview')}
          style={{
            padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer',
            background: 'overview' === activeTeamId ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
            color: 'overview' === activeTeamId ? 'black' : 'white',
            border: 'none', fontWeight: 'bold'
          }}
        >
          Overzicht Alle Teams
        </button>

        {teams.map(t => (
          editingTeamId === t.id ? (
            <input
              key={t.id}
              autoFocus
              value={editingName}
              onChange={e => setEditingName(e.target.value)}
              onBlur={() => handleRenameSubmit(t.id)}
              onKeyDown={e => e.key === 'Enter' && handleRenameSubmit(t.id)}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: 'white', color: 'black', border: 'none', outline: 'none' }}
            />
          ) : (
            <button
              key={t.id}
              onClick={() => setActiveTeamId(t.id)}
              onDoubleClick={() => { setEditingTeamId(t.id); setEditingName(t.name); }}
              style={{
                padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer',
                background: t.id === activeTeamId ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                color: t.id === activeTeamId ? 'black' : 'white',
                border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {t.name} ({t.riders.length}/20)
              <span onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }} style={{ opacity: 0.5, cursor: 'pointer', display: 'flex' }} title="Verwijder Team"><X size={14} /></span>
            </button>
          )
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

      {activeTeamId === 'overview' ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', minHeight: '50vh' }}>
          <h2 style={{ fontSize: '1.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>Ploegen Overzicht</h2>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {teams.map(t => {
              const points = t.riders.reduce((s, id) => s + (ridersMeta[id]?.global_score || 0), 0);
              const spent = t.riders.reduce((s, id) => s + (ridersMeta[id]?.sporza_price || 0), 0);
              return (
                <div key={t.id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.4rem', color: 'var(--text-highlight)' }}>{t.name}</h3>
                    <button onClick={() => handleDeleteTeam(t.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.2rem' }}>
                      <X size={20} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-main)' }}>Renners:</span>
                    <strong>{t.riders.length}/20</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-main)' }}>Budget Gebruikt:</span>
                    <strong style={{ color: spent > 120 ? 'var(--accent-red)' : 'var(--primary-color)' }}>€{spent}M / 120M</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-main)' }}>PCS Potentieel:</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-highlight)' }}>{points} pts</strong>
                  </div>
                  <button onClick={() => setActiveTeamId(t.id)} className="glass-panel" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', background: 'var(--primary-color)', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    Ploeg Bewerken
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
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
                <h2 style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>{activeRaceMeta?.name}<br />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'normal' }}>
                    {activeRaceMeta?.is_completed ? 'Officiële Sporza Prestaties' : 'Je Team Prognose'}
                  </span>
                </h2>
              </div>
              {activeRaceMeta?.is_completed ? (
                <div style={{ background: 'var(--primary-color)', color: 'black', fontWeight: 'bold', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                  {current12Starters.reduce((sum, id) => sum + (activeRaceMeta.actual_results?.[id]?.points || 0), 0)} pts
                </div>
              ) : (
                <span className="stat-value" style={{ fontSize: '1rem' }}>{current12Starters.length}/12</span>
              )}
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
                      <TeamLogo teamName={rider?.team} logoUrl={rider?.team_logo} size={24} />
                    </div>
                    <div className="rider-info">
                      <div className="rider-name">{rider?.name || 'Onbekend'}</div>
                      <div className="rider-team" style={{ gap: '10px' }}>
                        <span style={{ color: 'var(--primary-color)' }}>{rider?.global_score} pts</span>
                        <span style={{ opacity: 0.5 }}>| €{rider?.sporza_price || 0}M</span>
                      </div>
                    </div>

                    {activeRaceMeta?.is_completed ? (
                      <div style={{
                        fontSize: '1rem',
                        background: 'var(--primary-color)',
                        color: '#000',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        +{activeRaceMeta.actual_results?.[riderId]?.points || 0} pts
                      </div>
                    ) : raceRank ? (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                <TrendingUp size={24} color="var(--primary-color)" />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '1.2rem' }}>Ploeg samenstellen</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Selecteer ({activeTeam.riders.length}/20)</div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Resterend Budget</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: teamRemaining < 0 ? 'var(--accent-red)' : 'var(--primary-color)' }}>
                    €{teamRemaining}M <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>/ €120M</span>
                  </div>
                </div>
              </div>

              {/* FILTERS AND SORTING */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Zoek renner..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={teamFilter}
                    onChange={e => setTeamFilter(e.target.value)}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--bg-color)', color: 'white', outline: 'none' }}
                  >
                    <option value="All Teams">Alle Teams</option>
                    {Array.from(new Set(ridersList.map(r => r.team).filter(Boolean))).sort().map(team => (
                      <option key={team as string} value={team as string}>{team}</option>
                    ))}
                  </select>
                  <select
                    value={maxBudget}
                    onChange={e => setMaxBudget(e.target.value === "All" ? "All" : Number(e.target.value))}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--bg-color)', color: 'white', outline: 'none', maxWidth: '140px' }}
                  >
                    <option value="All">Max Budget</option>
                    <option value={12}>&le; €12M</option>
                    <option value={10}>&le; €10M</option>
                    <option value={8}>&le; €8M</option>
                    <option value={6}>&le; €6M</option>
                    <option value={4}>&le; €4M</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--bg-color)', color: 'white', outline: 'none' }}
                  >
                    <option value="score_desc">Rangschikking: PCS Score</option>
                    <option value="race_desc">Rangschikking: Actieve Race</option>
                    <option value="budget_desc">Rangschikking: Duurste</option>
                    <option value="budget_asc">Rangschikking: Goedkoopste</option>
                    <option value="roi_desc">Rangschikking: Beste ROI</option>
                  </select>
                </div>
              </div>

              {processedRiders.map((rider, index) => {
                const inCustomTeam = activeTeam.riders.includes(rider.id);
                const isRacing = activeRaceId && rider.starts.includes(activeRaceId);

                return (
                  <div
                    key={rider.id}
                    className="rider-card"
                    style={{
                      borderColor: inCustomTeam ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                      background: inCustomTeam ? 'rgba(102, 252, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      marginBottom: '8px',
                      opacity: activeRaceId && !isRacing ? 0.6 : 1
                    }}
                    onClick={() => handleToggleRider(rider.id)}
                  >
                    <div style={{ color: 'var(--text-main)', fontSize: '0.8rem', width: '25px', opacity: 0.5 }}>{index + 1}.</div>
                    <div className="rider-avatar">
                      <TeamLogo teamName={rider?.team} logoUrl={rider?.team_logo} size={28} />
                    </div>
                    <div className="rider-info" style={{ marginLeft: '10px' }}>
                      <div className="rider-name" style={{ fontSize: '0.95rem', color: inCustomTeam ? 'var(--text-highlight)' : 'var(--text-highlight)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {rider?.name}
                        {isRacing && <span style={{ fontSize: '0.6rem', background: 'var(--primary-color)', color: '#000', padding: '2px 5px', borderRadius: '4px' }}>Rides</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-main)' }}>ROI: {rider.roi || 0} pts/M</div>
                    </div>
                    <div className="rider-price" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', fontSize: '0.85rem', padding: '0.2rem 0.6rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>€{rider.sporza_price || 0}M</span>

                      {/* Dynamic Ranking View depending on active sort */}
                      {sortBy === 'score_desc' && <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>{rider.global_score} pts</span>}
                      {sortBy === 'roi_desc' && <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>{rider.roi} ROI</span>}
                      {sortBy === 'budget_desc' && <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>{rider.global_score} pts</span>}
                      {sortBy === 'budget_asc' && <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>{rider.global_score} pts</span>}
                      {sortBy === 'race_desc' && activeRaceId && <span style={{ fontSize: '0.65rem', color: 'var(--primary-color)' }}>#{rider.top_ranks?.[activeRaceId] || '-'} Rank</span>}
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
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
