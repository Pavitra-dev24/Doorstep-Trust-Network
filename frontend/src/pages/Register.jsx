import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const initial = { name: "", locality: "", plus_code: "", landmark: "", phone: "" };

export default function Register() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const household = await api.createHousehold({
        ...form,
        landmark: form.landmark || undefined,
        phone: form.phone || undefined,
      });
      navigate(`/household/${encodeURIComponent(household.plus_code)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section">
      <div className="container-narrow">
        <div className="section-head">
          <span className="eyebrow">Step one</span>
          <h2>Register a doorstep</h2>
          <p>
            You'll need a full Plus Code — not a short one like "8Q7X+2X
            Locality". Don't have one? Generate it free at{" "}
            <a href="https://plus.codes" target="_blank" rel="noreferrer" style={{ color: "var(--marigold-400)" }}>
              plus.codes
            </a>{" "}
            or by long-pressing a spot in Google Maps.
          </p>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="name">Household name</label>
            <input id="name" required value={form.name} onChange={update("name")} placeholder="e.g. Sharma Household" />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="locality">Locality</label>
              <input id="locality" required value={form.locality} onChange={update("locality")} placeholder="e.g. Palam Vihar, Gurgaon" />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" value={form.phone} onChange={update("phone")} placeholder="10-digit number" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="plus_code">Full Plus Code</label>
            <input
              id="plus_code"
              required
              value={form.plus_code}
              onChange={update("plus_code")}
              placeholder="7JVW52GR+2Q"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <span className="hint">Full codes are 8–11 characters and always include a "+".</span>
          </div>

          <div className="form-field">
            <label htmlFor="landmark">Landmark (optional)</label>
            <input id="landmark" value={form.landmark} onChange={update("landmark")} placeholder="e.g. Near Shiv Mandir, blue gate" />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? "Registering…" : "Register doorstep"}
          </button>
        </form>
      </div>
    </section>
  );
}
