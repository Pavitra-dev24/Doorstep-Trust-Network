import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";

export default function Marker() {
  const { plusCode } = useParams();
  const [household, setHousehold] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .getHousehold(plusCode)
      .then(setHousehold)
      .catch(() => setNotFound(true));
  }, [plusCode]);

  if (notFound) {
    return (
      <section className="section container-narrow">
        <div className="section-head">
          <h2>No record for {plusCode}</h2>
        </div>
        <Link className="btn btn-primary" to="/register">Register this doorstep</Link>
      </section>
    );
  }

  if (!household) {
    return (
      <section className="section container-narrow">
        <div className="spin" aria-label="Loading" />
      </section>
    );
  }

  const lookupUrl = `${window.location.origin}/household/${encodeURIComponent(household.plus_code)}`;

  return (
    <section className="section">
      <div className="container-narrow">
        <div className="section-head marker-intro">
          <h2>Doorstep marker</h2>
          <p>
            A physical, offline-discoverable marker for the actual door —
            print it, laminate it, and pin it up. Scanning the code opens
            this household's live trust page; anyone can also just read
            the Plus Code aloud over a phone call.
          </p>
        </div>

        <div className="marker-card">
          <div className="marker-card-header">
            <svg width="18" height="18" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="44" fill="none" stroke="#F2A93B" strokeWidth="8" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#49B3A6" strokeWidth="7" />
            </svg>
            DOORSTEP TRUST NETWORK
          </div>

          <div className="marker-qr-wrap">
            <QRCodeSVG value={lookupUrl} size={180} bgColor="#ffffff" fgColor="#0f1c2e" level="M" />
          </div>

          <div className="marker-name">{household.name}</div>
          <div className="marker-locality">{household.locality}</div>
          {household.landmark && <div className="marker-locality">{household.landmark}</div>}

          <div className="marker-code">{household.plus_code}</div>

          <div className="marker-footer">
            Scan to verify · {household.trust_tier} ({household.vouch_count} vouches)
          </div>
        </div>

        <div className="marker-actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print marker
          </button>
          <Link className="btn btn-secondary" to={`/household/${encodeURIComponent(household.plus_code)}`}>
            Back to household
          </Link>
        </div>
      </div>
    </section>
  );
}
