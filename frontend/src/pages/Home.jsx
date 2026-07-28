import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Home() {
  const [code, setCode] = useState("");
  const [households, setHouseholds] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listHouseholds()
      .then(setHouseholds)
      .catch(() => setHouseholds([]))
      .finally(() => setLoadingList(false));
  }, []);

  function handleLookup(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) navigate(`/household/${encodeURIComponent(trimmed.toUpperCase())}`);
  }

  return (
    <>
      <header className="hero">
        <div className="container">
          <span className="eyebrow">Community-verified addressing</span>
          <h1>Know you're at the right door before you knock.</h1>
          <p className="hero-sub">
            DoorStep is a trust layer on top of Google's open Plus Codes.
            Neighbours vouch for a household's code, so a delivery rider,
            an ambulance driver, or a first-time visitor can sanity-check
            an address before they ever travel there.
          </p>

          <form className="lookup-form" onSubmit={handleLookup}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter a Plus Code, e.g. 7JVW52GR+2Q"
              aria-label="Plus Code"
            />
            <button className="btn btn-primary" type="submit">
              Check trust
            </button>
          </form>
          <p className="lookup-hint">
            Don't have one to try? Register a home first, or open one from the list below.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>The gap this fills</h2>
            <p>
              Roughly 68% of India's population lives where addresses are
              written as chains of landmarks, not street numbers, and
              unclear addresses are a documented factor in delayed
              emergency response. Plus Codes solve the coordinate problem,
              but there's no way for a stranger to know a code is current
              and trustworthy before they act on it. That's the missing
              layer.
            </p>
          </div>
          <div className="problem-stats">
            <div className="stat">
              <span className="stat-num">68%</span>
              <span className="stat-label">of India's population is rural, where formal street addressing rarely exists</span>
            </div>
            <div className="stat">
              <span className="stat-num">0</span>
              <span className="stat-label">built-in way to verify a Plus Code is trustworthy before Plus Codes + DoorStep</span>
            </div>
            <div className="stat">
              <span className="stat-num">SMS</span>
              <span className="stat-label">fallback works even with no data connection, see the simulator</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              <h3>Register the doorstep</h3>
              <p>A household adds their name, locality, and full Plus Code, decoded and validated instantly.</p>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <h3>Neighbours vouch</h3>
              <p>People who actually know the household, a neighbour, a kirana store owner, add a vouch.</p>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <h3>Checked before travel</h3>
              <p>Anyone can look up the code and see a transparent trust tier before committing to the trip.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2>Recently registered</h2>
            <p>A live view of the demo database, try looking one of these up.</p>
          </div>

          {loadingList && <div className="spin" aria-label="Loading" />}

          {!loadingList && households.length === 0 && (
            <div className="empty-state">
              No households registered yet. Be the first, register a home to get started.
            </div>
          )}

          <div className="directory-list">
            {households.map((h) => (
              <a key={h.id} className="directory-item" href={`/household/${encodeURIComponent(h.plus_code)}`}>
                <div>
                  <div className="directory-item-name">{h.name}</div>
                  <div className="directory-item-code">{h.locality} · {h.plus_code}</div>
                </div>
                <span className={`code-chip seal-tier-${h.trust_tier.replace(/\s+/g, "")}`} style={{ color: "var(--seal-color)", borderColor: "var(--seal-color)" }}>
                  {h.trust_tier} · {h.vouch_count}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
