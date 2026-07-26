import { useState } from "react";
import { api } from "../api";

const EXAMPLE = "TRUST 7JVW52GR+2Q";

export default function SmsSimulator() {
  const [thread, setThread] = useState([]);
  const [message, setMessage] = useState(EXAMPLE);
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    setThread((t) => [...t, { dir: "out", text }]);
    setMessage("");
    setSending(true);
    try {
      const { reply } = await api.simulateSms(text);
      setThread((t) => [...t, { dir: "in", text: reply }]);
    } catch {
      setThread((t) => [...t, { dir: "in", text: "Network error. Try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="section">
      <div className="container-narrow">
        <div className="section-head">
          <span className="eyebrow">Offline-first design</span>
          <h2>SMS fallback simulator</h2>
          <p>
            The households who need this most are also the ones least
            likely to have a data connection. This simulates a plain-text
            SMS/USSD path: send <code style={{ fontFamily: "var(--font-mono)" }}>TRUST &lt;PlusCode&gt;</code> and get a
            one-line reply back — no app, no data, works over a basic
            phone. Wiring this to a real telephony gateway (Twilio,
            Exotel) is noted as future work in the README.
          </p>
        </div>

        <div className="phone-shell">
          <div className="phone-screen">
            {thread.length === 0 && (
              <p style={{ textAlign: "center", fontSize: "0.82rem" }}>
                Try sending: <br />
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--marigold-400)" }}>{EXAMPLE}</span>
              </p>
            )}
            {thread.map((m, i) => (
              <div key={i} className={`bubble ${m.dir === "out" ? "bubble-out" : "bubble-in"}`}>
                {m.text}
              </div>
            ))}
            {sending && <div className="bubble bubble-in">…</div>}
          </div>

          <form className="phone-input-row" onSubmit={send}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="TRUST 7JVW52GR+2Q"
              aria-label="SMS message"
            />
            <button className="btn btn-primary" type="submit" disabled={sending}>
              Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
