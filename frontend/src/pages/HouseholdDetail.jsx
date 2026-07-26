import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import TrustSeal from "../components/TrustSeal";

const initialVouch = { voucher_name: "", voucher_phone: "", relation: "", note: "" };

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso + "Z").getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HouseholdDetail() {
  const { plusCode } = useParams();
  const navigate = useNavigate();

  const [household, setHousehold] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vouchForm, setVouchForm] = useState(initialVouch);
  const [vouchError, setVouchError] = useState("");
  const [vouchSubmitting, setVouchSubmitting] = useState(false);
  const [searchCode, setSearchCode] = useState("");

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .getHousehold(plusCode)
      .then(setHousehold)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [plusCode]);

  function updateVouch(field) {
    return (e) => setVouchForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleVouch(e) {
    e.preventDefault();
    setVouchError("");
    setVouchSubmitting(true);
    try {
      const updated = await api.vouch(plusCode, {
        ...vouchForm,
        voucher_phone: vouchForm.voucher_phone || undefined,
        note: vouchForm.note || undefined,
      });
      setHousehold(updated);
      setVouchForm(initialVouch);
    } catch (err) {
      setVouchError(err.message);
    } finally {
      setVouchSubmitting(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = searchCode.trim();
    if (trimmed) navigate(`/household/${encodeURIComponent(trimmed.toUpperCase())}`);
  }

  if (loading) {
    return (
      <section className="section container-narrow">
        <div className="spin" aria-label="Loading" />
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="section">
        <div className="container-narrow">
          <div className="section-head">
            <h2>No record for {plusCode}</h2>
            <p>This Plus Code hasn't been registered on DoorStep yet.</p>
          </div>
          <Link className="btn btn-primary" to="/register">Register this doorstep</Link>
        </div>
      </section>
    );
  }

  const tierSlug = household.trust_tier.replace(/\s+/g, "");

  return (
    <section className="section">
      <div className="container-narrow">
        <form className="lookup-form" onSubmit={handleSearch} style={{ marginTop: 0, marginBottom: 32, maxWidth: "100%" }}>
          <input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Look up another Plus Code"
            aria-label="Plus Code"
          />
          <button className="btn btn-secondary" type="submit">Check</button>
        </form>

        <div className="card">
          <div className="household-header">
            <TrustSeal tier={household.trust_tier} vouchCount={household.vouch_count} />
            <div className="household-meta">
              <h2>{household.name}</h2>
              <p className="locality">{household.locality}</p>
              {household.landmark && <p className="locality">{household.landmark}</p>}
              <div className="code-chip">{household.plus_code}</div>

              <div className="meta-links">
                <a
                  className="btn btn-secondary"
                  href={`https://plus.codes/${encodeURIComponent(household.plus_code)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Plus Codes ↗
                </a>
                <Link className="btn btn-secondary" to={`/household/${encodeURIComponent(household.plus_code)}/marker`}>
                  Printable doorstep marker
                </Link>
              </div>
            </div>
          </div>

          <div className="divider" />

          <h3 style={{ marginBottom: 16, fontSize: "1.05rem" }}>
            Vouches ({household.vouch_count})
          </h3>

          {household.vouches.length === 0 ? (
            <div className="empty-state">
              No one has vouched for this doorstep yet. Know this household? Add the first vouch below.
            </div>
          ) : (
            <div className="vouch-list">
              {household.vouches.map((v) => (
                <div className="vouch-item" key={v.id}>
                  <div className="vouch-item-head">
                    <span className="vouch-name">{v.voucher_name}</span>
                    <span className="vouch-date">{timeAgo(v.created_at)}</span>
                  </div>
                  <span className="vouch-relation">{v.relation}</span>
                  {v.note && <p className="vouch-note">{v.note}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="divider" />

          <h3 style={{ marginBottom: 16, fontSize: "1.05rem" }}>Add a vouch</h3>
          <form onSubmit={handleVouch}>
            {vouchError && <div className="alert alert-error">{vouchError}</div>}

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="voucher_name">Your name</label>
                <input id="voucher_name" required value={vouchForm.voucher_name} onChange={updateVouch("voucher_name")} placeholder="e.g. Ramesh Kumar" />
              </div>
              <div className="form-field">
                <label htmlFor="voucher_phone">Your phone (optional)</label>
                <input id="voucher_phone" value={vouchForm.voucher_phone} onChange={updateVouch("voucher_phone")} placeholder="10-digit number" />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="relation">How do you know this household?</label>
              <input id="relation" required value={vouchForm.relation} onChange={updateVouch("relation")} placeholder="e.g. Neighbour, Kirana store owner" />
            </div>

            <div className="form-field">
              <label htmlFor="note">Note (optional)</label>
              <textarea id="note" rows={2} value={vouchForm.note} onChange={updateVouch("note")} placeholder="e.g. Known this family 5 years" />
            </div>

            <button className={`btn btn-primary btn-block seal-tier-${tierSlug}`} type="submit" disabled={vouchSubmitting}>
              {vouchSubmitting ? "Adding vouch…" : "Add my vouch"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
