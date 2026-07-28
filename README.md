# DoorStep — Trust Network

[![Live App](https://img.shields.io/badge/Live-App-2ea44f?style=for-the-badge)](https://doorstep-trust-network.vercel.app/)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat-square&logo=sqlite&logoColor=white)
![Backend on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square)
![Frontend on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

A community verification layer built on Google's open Plus Codes addressing system. Households register a Plus Code, neighbours who know them add a vouch, and the resulting trust score helps a delivery rider, ambulance driver, or first time visitor check an address before travelling there.

**Live app:** https://doorstep-trust-network.vercel.app/

---

## What this project does

A household registers with a real Plus Code. Neighbours who actually know that household can vouch for it, and each vouch raises a transparent trust tier, from New to Highly Trusted. Anyone, a delivery rider, an ambulance dispatcher, a first time visitor, can look up that Plus Code and see the current trust tier before they travel there.

A printable marker with a QR code makes the doorstep itself discoverable offline. A simulated SMS path shows how the same lookup could work over a basic phone with no data connection at all.

## What it tries to solve

Roughly 68 percent of India's population lives where formal street addresses do not exist. Addresses are written as chains of landmarks instead, a village, a post office, a police station, a district. Google's Plus Codes solve the coordinate problem by giving any location a short, shareable code, but a code on its own carries no signal of trust. There is no built in way for a stranger to know if a given Plus Code is current, accurate, and actually tied to the household it claims to be.

Unclear addressing is a documented factor in delayed emergency response. DoorStep adds the missing layer on top of an already open addressing format, a lightweight, community verified trust score.

---

## Features

**Backend** (FastAPI + SQLAlchemy, Python)
- `POST /households`: registers a household. The Plus Code is decoded and validated server side with Google's `openlocationcode` library, rejecting short codes and invalid input.
- `GET /households/{plus_code}`: full detail including all vouches.
- `GET /households?locality=`: directory and search.
- `POST /households/{plus_code}/vouch`: adds a vouch, with a duplicate guard by phone or name.
- `GET /trust-score/{plus_code}`: quick trust check, meant for a delivery or dispatch tool before travel.
- `POST /sms/simulate`: mocks an offline SMS or USSD fallback. Sending `TRUST <PlusCode>` returns a one line reply.
- Auto-generated API docs at `/docs`.

**Frontend** (React + Vite)
- Home: live Plus Code lookup and registered households directory.
- Register: Plus Code validated against the backend on submit.
- Household detail: trust seal, vouch list, vouch form.
- Printable doorstep marker: QR code and Plus Code, styled for print.
- SMS fallback simulator: chat style mock of the offline path.

**Trust score model** (transparent by design, not a black box):

| Vouches | Tier            | Score        |
|---------|-----------------|--------------|
| 0       | New             | 0            |
| 1-2     | Building Trust  | 15-30        |
| 3-5     | Verified        | 45-75        |
| 6+      | Highly Trusted  | 90-100 (max) |

## Architecture

```
Browser
  |
  |  HTTPS
  v
React frontend (Vercel)
  |
  |  HTTPS + CORS
  v
FastAPI backend (Render)
  |
  v
SQLite or Postgres
```

Two independent deployments connected only by HTTPS and a CORS allowlist. No shared network, no shared filesystem.

---

## Project structure

```
doorstep-trust-network/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── trust.py
│   ├── database.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api.js
│   │   └── styles.css
│   └── vercel.json
└── render.yaml
```

`backend/` holds the FastAPI app: routes, models, schemas, the trust score and Plus Code logic, and the database engine setup. `frontend/` holds the React app: pages for each screen, shared components, the API client, and the design system.

---

## Run locally

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
Visit `http://localhost:5173`. It points at `http://localhost:8000` via `.env.local`.

Full loop to try: register a household with a real Plus Code (generate one at [plus.codes](https://plus.codes) if needed), open its detail page, add a vouch, watch the trust seal update, open the printable marker, then send `TRUST <your code>` in the SMS simulator.

---