# Kirova AI — From Voice to Verified Action

> Multilingual AI-assisted industrial maintenance platform built by **Team Sudarshan**

[![Tests](https://img.shields.io/badge/tests-27%2F27%20passing-brightgreen)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()

---

## What is Kirova AI?

Kirova AI transforms verbal factory-floor fault reports into structured, reviewable, and human-verified maintenance work orders. Technicians speak or type in Hindi, Hinglish, Tamil, Telugu, or English — Kirova AI extracts the machine, symptom, severity, and required parts, routes the report through a supervisor approval gate, assigns it to a technician, and records every action in a tamper-proof audit trail.

**Tagline:** *From Voice to Verified Action*

---

## Quick Start

```bash
# Install all workspace dependencies
npm install

# Seed the database with demo machines and users
npm run seed

# Start the backend API server (port 5000)
npm run dev:server

# Start the frontend Vite dev server (port 5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) to see the public landing page.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Supervisor | supervisor@kirova.ai | `Supervisor@123` |
| Technician | tech.rajesh@kirova.ai | `Tech@123` |
| Technician | tech.vikram@kirova.ai | `Tech@123` |
| Line Operator | worker.amit@kirova.ai | `Worker@123` |

---

## Architecture

```
USER INPUT (Voice/Text)
     ↓
INTENT & CONTEXT (Sarvam Saaras + Faster-Whisper)
     ↓
VALIDATION GATE (Anti-Hallucination Evidence Grounding)
     ↓
SUPERVISOR SIGN-OFF (RBAC Approval Gate)
     ↓
WORK ORDER FSM (Assigned → In Progress → Resolved → Verified Closed)
     ↓
IMMUTABLE AUDIT LOG (PostgreSQL triggers, append-only)
```

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Vanilla CSS
- **Backend**: Node.js, Express, TypeScript, tsx
- **Database**: PGlite (embedded PostgreSQL, persistent, zero cloud cost)
- **Speech**: Sarvam Saaras (Hinglish/vernacular) + Faster-Whisper fallback
- **LLM**: OpenAI / Gemini with deterministic structured fallback
- **Auth**: JWT, bcryptjs, RBAC (SUPERVISOR / REPORTER_TECHNICIAN)
- **Testing**: Vitest (27/27 tests passing)

---

## Project Structure

```
Kirova-AI/           ← project root
├── client/          ← Vite + React frontend
│   └── src/
│       ├── App.tsx              ← Application shell + routing
│       ├── pages/LandingPage.tsx
│       └── components/landing/  ← Editorial landing page components
├── server/          ← Express API backend
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── db/
│       └── scripts/seed.ts
├── docs/            ← PRD, Architecture, Implementation Plan
└── package.json     ← Monorepo root (npm workspaces)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Start frontend on port 5173 |
| `npm run dev:server` | Start backend on port 5000 |
| `npm run seed` | Seed demo data |
| `npm test` | Run all 27 automated tests |
| `npm run build` | Build both client and server |

---

## Team

Made with ❤️ by **Team Sudarshan** — HackFront India 2026
