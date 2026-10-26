<div align="center">

# ⚙️ Kirova AI
### Evidence-Driven Industrial Maintenance Intelligence

**From Voice to Verified Action — powered by traceable AI**

[![Tests](https://img.shields.io/badge/tests-44%2F44%20passing-brightgreen?style=for-the-badge&logo=vitest)](./server/tests)
[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=vite)](./client)
[![Zero Hallucination](https://img.shields.io/badge/hallucination-0.0%25-blue?style=for-the-badge)](./server/src/scripts/run_eval.ts)
[![Version](https://img.shields.io/badge/version-2.0.0-purple?style=for-the-badge)](./docs/PRD.md)
[![HackFront India 2026](https://img.shields.io/badge/HackFront%20India-2026-orange?style=for-the-badge)](.)

*Built by **Team Sudarshan** · HackFront India 2026*

</div>

---

## 🧠 What is Kirova AI?

Kirova AI is an **evidence-driven industrial maintenance intelligence platform** that connects every new machine fault to its full historical maintenance context — and helps workers, technicians, and supervisors make faster, more traceable maintenance decisions.

A factory worker speaks or types a fault in **Hindi, Hinglish, or English**. Kirova AI:

1. **Transcribes and extracts** the report into a structured incident
2. **Retrieves real historical evidence** for that machine — no invented history
3. **Builds a source-linked evidence graph** connecting faults → components → prior repairs → outcomes
4. **Generates a 4-way repair-vs-replace assessment** (Inspect / Repair / Replace Component / Replace Machine)
5. **Routes through a human supervisor gate** — no AI action is autonomous
6. **Assigns a technician** who records actual findings and outcome
7. **Feeds verified outcomes back** into the evidence base for future intelligence

> **Core principle:** Every fact carries an explicit provenance label — `REPORTED`, `RETRIEVED`, `SUGGESTED`, or `UNVERIFIED`. The system never invents machine IDs, timestamps, or maintenance history.

---

## 🎯 The Problem We Solve

In small and mid-sized factories, maintenance problems are communicated through verbal instructions, WhatsApp messages, or handwritten slips. This creates:

| Problem | Impact |
|---|---|
| 🗣️ **Unstructured reporting** | Critical details lost — machine ID, symptom, shift time |
| 🔁 **Repeated failures** | Same fault fixed differently every time, no knowledge retained |
| 🤖 **Unverifiable AI output** | AI summaries look confident even when fabricating information |
| 🔒 **No accountability chain** | Who approved? Who did the work? Was it actually fixed? |
| 📊 **Fragmented history** | No connection between current fault and past repairs on the same machine |

---

## ✨ Key Features

### 🎙️ Multilingual Fault Intake
- Voice or text reporting in **Hindi, Hinglish, and English**
- Sarvam AI STT for Indian-accented speech; deterministic mock fallback for offline use
- Dual transcript storage: original preserved immutably, corrected version tracked with author + timestamp

### 🔍 Zero-Hallucination Evidence Engine
- **Deterministic asset disambiguation** — if "Machine 4" matches both `MCH-004` and `MCH-014`, the system asks; it never guesses
- Unknown machines return `AWAITING_CLARIFICATION`, never a fabricated asset ID
- All 30 evaluation test cases pass with **0.0% unsupported machine IDs, 0.0% unsupported timestamps, 0.0% unsupported history**

### 🏷️ Source-Linked Evidence Labels
Every extracted field is tagged with its provenance:

| Label | Meaning |
|---|---|
| `REPORTED` | Directly stated by the worker in their own words |
| `RETRIEVED` | Fetched from the verified asset registry or history database |
| `SUGGESTED` | AI-inferred, marked as unconfirmed — awaiting human review |
| `UNVERIFIED` | Ambiguous or conflicting — explicitly flagged, never silently assumed |

### 🕸️ Evidence Graph
Interactive source-linked graph showing:
```
Machine → Component → Fault/Symptom → Maintenance Event → Repair Action → Documented Outcome → Source Record
```
Every node is clickable and traces back to its original source record.

### ⚖️ 4-Way Repair vs Replace Decision Support
Structured advisory comparison across four options:

| Option | Description |
|---|---|
| 🔎 **INSPECT** | Gather more diagnostic evidence before committing |
| 🔧 **REPAIR** | Fix the existing component based on historical repair data |
| 🔩 **REPLACE COMPONENT** | Swap the faulty part with cost/downtime comparison |
| 🏭 **REPLACE MACHINE** | Full asset replacement with ROI and risk analysis |

Each option shows: historical recurrence, documented repair outcomes, cost categories, downtime estimates, risks, and all unknown/missing fields explicitly labeled.

> ⚠️ **Advisory only.** The supervisor retains full decision authority. No AI action is autonomous.

### 🔐 Server-Enforced RBAC
- All permissions enforced at the **API level** — hiding a button is not security
- Technicians cannot approve or close their own work orders (HTTP 403)
- Case-level access: technicians access case history **only after official supervisor assignment**
- Supervisors cannot self-verify if they acted as the technician

### 📋 Immutable Audit Trail
- Append-only `audit_logs` table with a **database-level write-protection trigger**
- Every action records: actor ID, timestamp, previous state, new state, reason
- No `UPDATE` or `DELETE` on audit records — ever

### 🔄 Complete Workflow Lifecycle
```
WORKER REPORTS FAULT
→ IDENTIFY MACHINE & SYMPTOMS
→ RETRIEVE MAINTENANCE HISTORY
→ EXTRACT & CONNECT EVIDENCE
→ ANALYZE CAUSES & REPAIR OPTIONS
→ REPAIR vs. REPLACE ASSESSMENT
→ SUPERVISOR REVIEWS & APPROVES
→ TECHNICIAN RECORDS ACTUAL WORK
→ VERIFY & DOCUMENT OUTCOME
→ UPDATE THE EVIDENCE BASE
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Nihal-Tomar/Kirova-AI.git
cd Kirova-AI

# 2. Install all workspace dependencies
npm install

# 3. Seed the database (13 machines, 4 users, 10 verified historical work orders)
cd server && npm run seed

# 4. Start the backend API (port 5000) — in one terminal
npm run dev

# 5. Start the frontend (port 5173) — in another terminal
cd ../client && npm run dev
```

Open **http://localhost:5173** in your browser.

> **No API keys required for local demo.** STT and LLM run in deterministic mock mode automatically.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| 👔 **Supervisor** (Priya) | `priya@kirova.ai` | `demo123` | Full platform — approve, assign, verify, audit |
| 🔧 **Technician** (Rajesh) | `rajesh@kirova.ai` | `demo123` | Assigned work orders, case history, outcome recording |
| 👷 **Worker** (Amit) | `amit@kirova.ai` | `demo123` | Fault reporting, clarification responses |

---

## 🎬 2-Minute Demo Script

| Timestamp | Action | What to Show |
|---|---|---|
| **0:00–0:20** | Login as Worker (Amit) | Landing page → 1-click demo login pill |
| **0:20–0:45** | Submit Hinglish fault report | *"Machine 4 ka belt ajeeb noise kar raha hai aur ruk gaya hai"* |
| **0:45–1:05** | Ambiguity resolution | System shows `MCH-004` vs `MCH-014` — refuses to guess |
| **1:05–1:25** | Evidence labels | `REPORTED` symptom · `RETRIEVED` asset · `SUGGESTED` urgency |
| **1:25–1:45** | Login as Supervisor (Priya) | Review incident, open Evidence Graph tab |
| **1:45–2:00** | Repair vs Replace panel | 4-way comparison with costs, risks, and unknowns |
| **2:00–2:15** | Approve & Assign | Approve work order → assign to Rajesh |
| **2:15–2:30** | Login as Technician (Rajesh) | View assigned case, record findings, submit resolution |
| **2:30–2:45** | Supervisor verifies closure | Priya reviews findings → Verified Closed |
| **2:45–3:00** | Audit Trail | Every step timestamped with actor, state diff, reason |

**Failure demo (bonus):** Enter *"Machine 99 ka pressure drop hua"* → System flags `UNKNOWN_ASSET`, asks for clarification, never fabricates a machine.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                    │
│  Worker Portal · Supervisor Studio · Technician Task Board      │
│  Evidence Graph · Repair vs Replace Panel · Audit Timeline      │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + JWT Bearer Auth
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js + Express Backend                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Auth & RBAC  │  │ Workflow FSM  │  │  Audit Logger      │    │
│  │ JWT·bcrypt   │  │ Strict States│  │  Append-Only       │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AI & Evidence Processing Pipeline           │   │
│  │  STT → Extraction → Disambiguation → Evidence Labels    │   │
│  │  → Historical Grounding → Decision Support Engine       │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
         ┌───────────────────────────────────┐
         │   PGlite (Embedded PostgreSQL)    │
         │   Persistent · Zero Cloud Cost   │
         │   Immutable Audit Triggers       │
         └───────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Vanilla CSS | Type-safe, lightweight, shop-floor responsive |
| **Backend** | Node.js, Express, TypeScript, tsx | Fast async I/O, shared Zod schemas |
| **Database** | PGlite (embedded PostgreSQL) | Zero cloud cost, persistent, ACID-compliant |
| **Speech-to-Text** | Sarvam AI (Indian accents) + mock fallback | Works offline; Hinglish-optimized |
| **LLM Extraction** | OpenAI / Gemini + deterministic fallback | JSON-mode structured outputs, Zod-validated |
| **Auth** | JWT + bcryptjs, server-enforced RBAC | No frontend-only permission checks |
| **Testing** | Vitest + Supertest | 44/44 tests, 30-case AI benchmark |

---

## 📁 Project Structure

```
Kirova-AI/
├── client/                          ← React frontend (Vite)
│   └── src/
│       ├── App.tsx                  ← Application shell, routing, all panels
│       ├── pages/LandingPage.tsx    ← Public landing page
│       └── components/landing/     ← Hero, workflow, capabilities sections
│
├── server/                          ← Express API backend
│   └── src/
│       ├── controllers/             ← Route handlers (auth, reports, work orders, intelligence)
│       ├── services/                ← Business logic
│       │   ├── decisionSupport.ts   ← 4-way repair-vs-replace engine
│       │   ├── evidence.ts          ← Evidence label assembly
│       │   ├── history.ts           ← Historical incident retrieval (no fabrication)
│       │   ├── disambiguation.ts    ← Asset matching & ambiguity detection
│       │   ├── extraction.ts        ← LLM extraction with Zod validation
│       │   ├── stt.ts               ← Speech-to-text with mock fallback
│       │   └── audit.ts             ← Immutable audit event logger
│       ├── db/
│       │   ├── index.ts             ← PGlite initialization with stale-lock cleanup
│       │   ├── migrate.ts           ← Schema migration runner
│       │   └── schema.sql           ← Full PostgreSQL schema + audit triggers
│       └── scripts/
│           ├── seed.ts              ← 13 machines, 4 users, 10 verified work orders
│           └── run_eval.ts          ← 30-case AI benchmark evaluation
│
├── tests/                           ← 7 test suites, 44 tests
│   ├── case_access.test.ts          ← Case-level technician access gate (15 tests)
│   ├── workflow_fsm.test.ts         ← State machine transitions (9 tests)
│   ├── ambiguity.test.ts            ← Anti-hallucination & disambiguation (7 tests)
│   ├── auth_rbac.test.ts            ← Role-based access control (4 tests)
│   ├── malformed_ai.test.ts         ← LLM output error handling (3 tests)
│   ├── decision_support.test.ts     ← 4-way decision engine (2 tests)
│   └── audit_trail.test.ts          ← Immutable audit log (4 tests)
│
├── data/
│   └── evaluation_30_reports.json   ← 30 labelled test cases (Hindi/Hinglish/English)
│
└── docs/
    ├── PRD.md                       ← Full product requirements document
    ├── ARCHITECTURE.md              ← System architecture specification
    ├── IMPLEMENTATION_PLAN.md       ← 8-day roadmap & milestone gates
    └── TEST_PLAN.md                 ← Testing strategy & benchmark methodology
```

---

## 🧪 Test Results

### Automated Test Suite — 44/44 Passing

| Test Suite | Tests | Coverage |
|---|---|---|
| `case_access.test.ts` | 15 ✅ | Technician assignment gate, pre-assignment 403, case-level isolation |
| `workflow_fsm.test.ts` | 9 ✅ | All FSM state transitions, invalid-transition rejection |
| `ambiguity.test.ts` | 7 ✅ | Asset disambiguation, unknown machine handling, zero hallucination |
| `auth_rbac.test.ts` | 4 ✅ | Role enforcement, cross-org access prevention |
| `malformed_ai.test.ts` | 3 ✅ | Malformed LLM output trapping, transcript preservation |
| `decision_support.test.ts` | 2 ✅ | 4-way decision engine, evidence graph construction |
| `audit_trail.test.ts` | 4 ✅ | Append-only guarantee, tamper-proof trigger |
| **Total** | **44 ✅** | **7 suites** |

### AI Benchmark — 30-Case Evaluation (Zero Hallucination)

| Metric | Result |
|---|---|
| Unsupported Machine ID Rate | **0.0%** |
| Unsupported Timestamp Rate | **0.0%** |
| Unsupported History Rate | **0.0%** |
| Cases evaluated | 30 (10 Hindi · 10 Hinglish · 10 English) |

```bash
# Run tests
cd server && npm test

# Run AI benchmark
cd server && npm run test:eval
```

---

## 🗃️ Seeded Demo Data

The database is pre-seeded with synthetic data (clearly labeled):

- **1** Organization · **2** Sites · **4** Users
- **13** Industrial Machines across 5 equipment types:
  - Conveyors, CNC Milling Machines, Lathes, Hydraulic Presses, Air Compressors
- **10** Components per machine type
- **10** Verified Historical Work Orders (closed, with resolution records)
- Complete audit trail for all seeded events

---

## 📜 Scripts Reference

| Command | Where | Description |
|---|---|---|
| `npm run dev` | `server/` | Start backend on port 5000 (hot reload) |
| `npm run dev` | `client/` | Start frontend on port 5173 (hot reload) |
| `npm run seed` | `server/` | Reset and seed all demo data |
| `npm test` | `server/` | Run 44 automated tests |
| `npm run test:eval` | `server/` | Run 30-case AI hallucination benchmark |
| `npm run build` | `server/` | Compile TypeScript to `dist/` |
| `npm run build` | `client/` | Build production frontend bundle |

---

## 📐 API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | JWT login |
| `POST` | `/api/reports` | All | Submit voice or text report |
| `POST` | `/api/reports/:id/extract` | All | Run AI extraction pipeline |
| `POST` | `/api/reports/:id/clarify` | All | Resolve ambiguity |
| `POST` | `/api/work-orders` | Supervisor | Create work order from incident |
| `POST` | `/api/work-orders/:id/approve` | Supervisor | Approve work order |
| `POST` | `/api/work-orders/:id/assign` | Supervisor | Assign technician |
| `POST` | `/api/work-orders/:id/verify-close` | Supervisor | Verified closure |
| `GET` | `/api/incidents/:id/decision-support` | All | 4-way repair-vs-replace report |
| `GET` | `/api/incidents/:id/evidence-graph` | All | Source-linked evidence graph |
| `GET` | `/api/work-orders/:id/history` | Assigned Tech / Supervisor | Case history (access-gated) |
| `GET` | `/api/audit-logs` | Supervisor | Immutable audit trail |

---

## 🌐 Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | [`client/vercel.json`](./client/vercel.json) |
| Backend | Render | [`render.yaml`](./render.yaml) |

---

## 📚 Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Full product requirements, user journeys, functional requirements |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System architecture, data model, API spec, FSM, AI pipeline |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | 8-day roadmap, milestone gates, scope matrix |
| [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Testing strategy, 30-case benchmark specification |

---

## 👥 Team

<div align="center">

**Team Sudarshan**  
*HackFront India 2026 — Theme: Open Source & Innovation*

Made with ❤️ and a lot of `tsx watch`

</div>

- **1** Organization · **2** Sites · **4** Users
- **13** Industrial Machines across 5 equipment types:
  - Conveyors, CNC Milling Machines, Lathes, Hydraulic Presses, Air Compressors
- **10** Components per machine type
- **10** Verified Historical Work Orders (closed, with resolution records)
- Complete audit trail for all seeded events

---

## 📜 Scripts Reference

| Command | Where | Description |
|---|---|---|
| `npm run dev` | `server/` | Start backend on port 5000 (hot reload) |
| `npm run dev` | `client/` | Start frontend on port 5173 (hot reload) |
| `npm run seed` | `server/` | Reset and seed all demo data |
| `npm test` | `server/` | Run 44 automated tests |
| `npm run test:eval` | `server/` | Run 30-case AI hallucination benchmark |
| `npm run build` | `server/` | Compile TypeScript to `dist/` |
| `npm run build` | `client/` | Build production frontend bundle |

---

## 📐 API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | JWT login |
| `POST` | `/api/reports` | All | Submit voice or text report |
| `POST` | `/api/reports/:id/extract` | All | Run AI extraction pipeline |
| `POST` | `/api/reports/:id/clarify` | All | Resolve ambiguity |
| `POST` | `/api/work-orders` | Supervisor | Create work order from incident |
| `POST` | `/api/work-orders/:id/approve` | Supervisor | Approve work order |
| `POST` | `/api/work-orders/:id/assign` | Supervisor | Assign technician |
| `POST` | `/api/work-orders/:id/verify-close` | Supervisor | Verified closure |
| `GET` | `/api/incidents/:id/decision-support` | All | 4-way repair-vs-replace report |
| `GET` | `/api/incidents/:id/evidence-graph` | All | Source-linked evidence graph |
| `GET` | `/api/work-orders/:id/history` | Assigned Tech / Supervisor | Case history (access-gated) |
| `GET` | `/api/audit-logs` | Supervisor | Immutable audit trail |

---

## 🌐 Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | [`client/vercel.json`](./client/vercel.json) |
| Backend | Render | [`render.yaml`](./render.yaml) |

---

## 📚 Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Full product requirements, user journeys, functional requirements |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System architecture, data model, API spec, FSM, AI pipeline |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | 8-day roadmap, milestone gates, scope matrix |
| [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Testing strategy, 30-case benchmark specification |

---

## 👥 Team

<div align="center">

**Team Sudarshan**  
*HackFront India 2026 — Theme: Open Source & Innovation*

Made with ❤️ and a lot of `tsx watch`

</div>

