# DoorStep - Trust Network

A community-verification layer on top of Google's open **Plus Codes**
addressing system. Households register a Plus Code; neighbours who
actually know them add a vouch; the resulting transparent trust score
helps a delivery rider, ambulance driver, or first-time visitor
sanity-check an address *before* travelling there — especially useful
where addresses are landmark chains rather than street numbers.

Built as a portfolio project for the **Google Software Application
Development Apprenticeship (March 2027 start, India)** — see
`Google_Apprenticeship_-_Portfolio_Project_Ideas.pdf`, Idea 02, for the
full research and design brief this implements.

> Solo prototype, not a production system. Scope, tradeoffs, and honest
> "what I'd do next" notes are called out throughout this README on
> purpose — see *Framing this for your resume* at the bottom.

---

## What's actually built

- **Backend** — FastAPI + SQLAlchemy (Python)
  - `POST /households` — register a household; the Plus Code is decoded
    and validated server-side with Google's own `openlocationcode`
    library (rejects short codes / garbage input)
  - `GET /households/{plus_code}` — full detail incl. all vouches
  - `GET /households?locality=` — directory / search
  - `POST /households/{plus_code}/vouch` — add a vouch (duplicate-vouch
    guard by phone/name)
  - `GET /trust-score/{plus_code}` — the "about to travel there" quick
    check, meant to be called by a delivery/dispatch tool
  - `POST /sms/simulate` — mocks the offline SMS/USSD fallback described
    in the design brief (`TRUST <PlusCode>` → one-line reply)
  - Auto-generated API docs at `/docs` (Swagger) once deployed
- **Frontend** — React + Vite
  - Home: live Plus Code lookup + registered-households directory
  - Register: Plus Code validated against the backend on submit
  - Household detail: trust seal, vouch list, vouch form
  - Printable doorstep marker: QR code + Plus Code, styled for print
  - SMS fallback simulator: chat-style mock of the offline path
- **Trust score model** (transparent by design, not a black box):

  | Vouches | Tier            | Score        |
  |---------|-----------------|--------------|
  | 0       | New             | 0            |
  | 1–2     | Building Trust  | 15–30        |
  | 3–5     | Verified        | 45–75        |
  | 6+      | Highly Trusted  | 90–100 (cap) |

## What's intentionally *not* built (and why)

This is exactly the kind of scoping honesty the report's Part V argues
reads well on an apprenticeship resume:

- **No real SMS/USSD gateway.** `/sms/simulate` mocks the reply text a
  Twilio/Exotel integration would send. Wiring a real gateway needs a
  paid account and a phone number, out of scope for a free solo demo —
  but the endpoint is written so swapping in a real gateway is a small,
  contained change (see `main.py`, `simulate_sms`).
- **No auth.** Anyone can register a household or vouch. A real version
  needs phone OTP verification per vouch at minimum, to stop one person
  vouching under many names.
- **No distance-weighted trust.** The report's original design idea
  weights a voucher higher if their own registered address is nearby.
  The current model counts vouches only. The lat/lng is already decoded
  and stored on every household, so this is a natural next iteration.
- **SQLite by default.** Fine for a demo; see *Persistence* below for
  what changes in a real deployment.

---

## Project structure

```
doorstep-trust-network/
├── backend/              FastAPI app
│   ├── main.py             routes
│   ├── models.py           SQLAlchemy models
│   ├── schemas.py          Pydantic request/response shapes
│   ├── trust.py            trust score + Plus Code helpers
│   ├── database.py         SQLite/Postgres engine setup
│   └── requirements.txt
├── frontend/              React + Vite app
│   └── src/
│       ├── pages/           Home, Register, HouseholdDetail, Marker, SmsSimulator
│       ├── components/      Nav, TrustSeal
│       ├── api.js           backend client
│       └── styles.css       design system
├── render.yaml            Render Blueprint for the backend
└── frontend/vercel.json   SPA routing config for Vercel
```

---

## Run it locally first

**Backend**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` to confirm it's up.

**Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`. It already points at `http://localhost:8000`
via `.env.local`.

Try the full loop: Register a household with a real Plus Code (generate
one at [plus.codes](https://plus.codes) if you don't have one handy) →
open its detail page → add a vouch → watch the trust seal update →
open the printable marker → try `TRUST <your code>` in the SMS
simulator.

---

## Deploying: backend on Render

1. Push this project to a GitHub repo (see *Getting this into GitHub*
   below if you haven't done that yet).
2. In the [Render Dashboard](https://dashboard.render.com), click
   **New > Blueprint** and connect the repo. Render will detect
   `render.yaml` at the repo root and propose one web service,
   `doorstep-trust-network-api`, rooted at `/backend`.
3. Click **Deploy Blueprint**. First deploy takes a few minutes.
4. Once live, copy the service's URL (`https://doorstep-trust-network-api-XXXX.onrender.com`).
5. Open the service's **Environment** tab — you'll come back here in
   the *Connecting them* section below once your frontend URL exists.
6. Sanity-check it: visit `https://<your-render-url>/health` — you
   should see `{"status":"ok"}`, and `/docs` for the interactive API.

**No `render.yaml`? Deploy manually instead:** New > Web Service →
connect repo → Root Directory `backend` → Runtime `Python 3` → Build
Command `pip install -r requirements.txt` → Start Command
`uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Persistence (read before you rely on this for a demo day)

By default the API uses a local SQLite file. **Render's free-tier web
service disk is ephemeral** — every redeploy (including ones Render
triggers automatically) wipes it, so registered households will
disappear. Two options:

- **Fine for a portfolio demo:** re-seed a couple of households right
  before you show it to someone.
- **Real persistence:** add a Render Postgres instance (Render's
  dashboard: New > PostgreSQL, free tier available), copy its
  **Internal Connection String**, and set it as `DATABASE_URL` on the
  web service's Environment tab. The backend already reads
  `DATABASE_URL` automatically (see `database.py`) — no code changes
  needed.

---

## Deploying: frontend on Vercel

1. In the [Vercel Dashboard](https://vercel.com/new), import the same
   GitHub repo.
2. When asked for the **Root Directory**, set it to `frontend`. Vercel
   auto-detects Vite (`Build Command: npm run build`,
   `Output Directory: dist`) — leave those as-is.
3. Before deploying, add an environment variable:
   - `VITE_API_URL` = your Render URL from the previous section, e.g.
     `https://doorstep-trust-network-api-xxxx.onrender.com`
4. Click **Deploy**. Vercel gives you a URL like
   `https://doorstep-trust-network.vercel.app`.

## Connecting them

Backend and frontend are two separate deployments that talk over
plain HTTPS + CORS — there's no shared network, so this step is what
actually "connects" them:

1. Copy your live Vercel URL.
2. Back in the Render Dashboard, open the backend service → Environment
   → add or edit `ALLOWED_ORIGINS` to include it, comma-separated if
   you're keeping localhost for local dev too:
   ```
   ALLOWED_ORIGINS=https://doorstep-trust-network.vercel.app,http://localhost:5173
   ```
3. Save — Render redeploys automatically. Once it's back up, open your
   Vercel URL and confirm the Home page's "Recently registered" list
   loads instead of erroring — that confirms the frontend is
   successfully calling the backend across origins.

If it doesn't load: open the browser console. A CORS error there means
step 2 above hasn't finished redeploying yet, or the Vercel URL was
copied with a typo (no trailing slash).

---

## Getting this into GitHub (if starting from scratch)

```bash
cd doorstep-trust-network
git init
git add .
git commit -m "DoorStep Trust Network: initial prototype"
gh repo create doorstep-trust-network --public --source=. --push
# or, without the GitHub CLI:
# git remote add origin https://github.com/<you>/doorstep-trust-network.git
# git branch -M main
# git push -u origin main
```

---

## Framing this for your resume

Drawing directly from the report's own advice for this specific role
(evidence of self-directed, ambiguity-tolerant problem solving matters
more here than a single impressive system):

> **DoorStep Trust Network** — Built a community-verification layer on
> Google's open Plus Codes addressing system: a FastAPI + React app
> where neighbours vouch for a household's Plus Code, producing a
> transparent trust score visible before a rider or ambulance driver
> commits to a route. Includes a printable offline marker (QR + Plus
> Code) and a simulated SMS/USSD fallback for low-connectivity areas.
> Deployed on Render + Vercel.

Keep the honesty from the *What's intentionally not built* section
close by if it comes up in a recruiter call or interview — per the
report's own research into this role's actual funnel (HackerEarth
online challenge → recruiter call → technical/behavioral interviews),
being precise about scope and next steps is itself part of what's
being evaluated.

## Sources for the role research folded into this README

Google Careers listing for *Software Application Development
Apprenticeship, March 2027 Start* (application deadline 3 August 2026);
GeeksforGeeks, *Google India Apprenticeship Interview Experience 2025*
(HackerEarth online challenge format and recruiter-call content).
