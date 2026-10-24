# Kirova AI — 8-Day Implementation Plan & MVP Roadmap

**Document Version:** 2.0 (Reconciled with PRD v2.0)  
**Target Event:** HackFront India 2026 (23–31 October 2026)  
**Product Vision:** *From Voice to Verified Action*  

---

## 1. Executive Scope Mapping (P0 vs P1 vs P2)

Every requirement specified in the PRD is mapped to an MVP phase. Under the strict **Scope Rule** (PRD Section 6), if P0 is not stable by Day 6, P1 features are deferred. A completely verifiable vertical slice is prioritized over partial integrations.

### 1.1 Scope Matrix

| PRD Section / Requirement | Phase | MVP Target Delivery | Delivery Mechanism / Component |
|---|---|---|---|
| **FR-01: Authentication & Permissions** | **P0** | Day 2 | JWT Auth, bcrypt password hashing, 2 roles (`REPORTER_TECHNICIAN`, `SUPERVISOR`), backend middleware. |
| **FR-02: Voice & Text Reporting** | **P0** | Day 2 & 3 | Text report endpoint, audio file upload, Sarvam STT integration with resilient fallback stub. |
| **FR-03: Transcript Preservation** | **P0** | Day 3 | Dual-storage of `original_transcript` and `corrected_transcript`, author attribution on edits. |
| **FR-04: Schema-Constrained Extraction** | **P0** | Day 4 | Zod schema validation, JSON-mode LLM prompts, rejection/triage of malformed outputs. |
| **FR-05: Missing-Field & Ambiguity Detection** | **P0** | Day 4 | Deterministic SQL matching against seeded asset registry, candidate presentation for ambiguous machines, missing field check. |
| **FR-06: Evidence Labels** | **P0** | Day 5 | 4 labels: `REPORTED`, `RETRIEVED`, `SUGGESTED`, `UNVERIFIED` with source reference metadata on all fields. |
| **FR-07: Historical Incident Retrieval** | **P0** | Day 5 | Database queries for verified incidents on same machine & equipment type; never fabricated. |
| **FR-08: Work-Order Creation & Approval** | **P0** | Day 5 | Supervisor review UI & backend API (`POST /api/work-orders`, `POST /api/work-orders/:id/approve`, `reject`, `return`). Strict 403 for non-supervisors. |
| **FR-09: Assignment & Execution** | **P0** | Day 6 | Precondition: Must be `APPROVED`. Assignment endpoint, technician task board, execution status (`IN_PROGRESS`), resolution notes (`RESOLVED`). |
| **FR-10: Verified Closure** | **P0** | Day 6 | Supervisor-only verification action (`verify-close`), resolution summary verification, return for rework. |
| **FR-11: Audit Trail** | **P0** | Day 2 & 6 | Append-only `audit_logs` table, database-level write protection trigger, recording actor, timestamp, entity, diffs, and reasons. |
| **FR-12: Failure Recovery** | **P0** | Day 3 & 4 | STT fallback to manual entry, LLM validation error trapping, clear user error notifications without app crashes. |
| **Seeded Equipment Registry** | **P0** | Day 1 & 2 | 12 machines across 4 equipment types (Conveyors, CNC, Lathes, Compressors) with components. |
| **Evaluation Suite (30 Reports)** | **P0** | Day 1 & 7 | Exactly 30 synthetic labelled test cases evaluated quantitatively against strict metrics. |
| **FR-13: Recurring-Fault Intelligence** | **P0 / P1**| Day 5 (P0 CTE) / Day 7 (P1 Neo4j) | PostgreSQL CTE query baseline (P0) + Neo4j Graph slice (optional P1) if core workflow is stable. |
| **FR-14: Supervisor Dashboard** | **P1** | Day 7 | Operational dashboard showing open/closed counts, MTTR, awaiting review queue, recurring fault summary. |
| **Hindi TTS for Clarification Read-back** | **P1** | Day 7 | Text-to-speech feedback for operators answering clarification questions. |
| **Resolution Photo Attachments** | **P1** | Day 7 | File upload for before/after maintenance evidence. |
| **QR-based Machine Selection** | **P2** | Post-MVP | Camera scan of QR code to pre-populate exact `machine_id`. |
| **Simulated Sensor Alerts** | **P2** | Post-MVP | Ingest IoT sensor threshold breaches into draft incident reports. |
| **Offline-First Operation** | **P2** | Post-MVP | PWA service-worker queuing of reports during network disconnects. |
| **Enterprise CMMS/ERP Integration** | **P2** | Post-MVP | SAP / Maximo bi-directional connector. |

---

## 2. Demo-Critical Acceptance Criteria (PRD Section 15 Aligned)

To win the hackathon, the 3-minute demonstration must execute seamlessly against these criteria:

1. **Voice Ingestion & Dual Transcript (0:00–0:45):**
   - The user records/submits a noisy Hinglish voice report: *"Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai."*
   - Audio is transcribed; the UI renders both the immutable original transcript and an editable text box.
   - The user edits a word; the audit trail reflects the edit with author and timestamp.

2. **Ambiguity Resolution & Anti-Hallucination (0:45–1:05):**
   - "Machine 4" matches two seeded assets: `MCH-004` (Main Conveyor 4) and `MCH-014` (Lathe Machine 4).
   - The system **refuses to guess** and presents both candidates in a clarification modal.
   - User selects `MCH-004`. The draft updates with zero hallucinations.

3. **Evidence-Labelled Intelligence & Historical Grounding (1:05–1:30):**
   - Extracted draft displays color-coded badges:
     - `symptom_text`: **Reported** (Worker wording)
     - `machine_id`: **Retrieved** (Database asset record)
     - `urgency_suggestion`: **Suggested** (LLM reasoning: HIGH due to intermittent stoppage)
     - `historical_incidents`: **Retrieved** (Real historical records for Conveyors with belt slippage).

4. **Recurring-Fault Intelligence (1:30–1:50):**
   - Display cross-machine recurring fault clusters (PostgreSQL CTE or Neo4j) showing that Conveyor belts in Bay B have experienced 3 verified slippage incidents fixed by pulley realignment.

5. **Approval, Assignment, Execution & Closure (1:50–2:20):**
   - Supervisor approves report via `POST /api/work-orders/:id/approve` (status becomes `APPROVED`).
   - Supervisor assigns technician via `POST /api/work-orders/:id/assign` (precondition: order must be `APPROVED`).
   - Technician logs in, marks task `IN_PROGRESS`, enters findings (*"Belt tensioner worn out, replaced with spare PT-882"*), and submits resolution (status becomes `RESOLVED`).
   - Technician cannot close the ticket (UI prevents it; API returns 403 on self-closure).
   - Supervisor logs in, reviews resolution notes, and clicks `Verify & Close`. Status transitions to `VERIFIED_CLOSED`.

6. **Accountability & Failure Handling (2:20–3:00):**
   - Open Audit Trail: view every step timestamped with actors (`Worker 1`, `Supervisor Priya`, `Tech Rajesh`).
   - Run Failure Demo: enter *"Machine 99 broken"*. System flags `UNKNOWN_ASSET` and asks for clarification without fabricating an asset ID.

---

## 3. Eight-Day Detailed Implementation Roadmap

### Day 1 (23 Oct 2026): Foundation, Schema & Evaluation Benchmark
- **Deliverables:**
  - Initialize Node.js + Express backend and React frontend in workspace.
  - Setup Prisma ORM with PostgreSQL database schema (Users, Sites, Machines, Components, Incidents, Evidence, WorkOrders, WorkOrderStatusHistory, AuditLogs).
  - Apply database-level trigger on `audit_logs` preventing `UPDATE` and `DELETE`.
  - Seed 12 industrial machines across 4 equipment types with realistic components and 10 verified historical incidents.
  - Author `data/evaluation_30_reports.json` containing exactly 30 labelled test cases with ground-truth fields, ambiguous assets, and expected failure modes.
- **Milestone Gate:** Database migrations run cleanly; seed data populates verified machines and incidents.

### Day 2 (24 Oct 2026): Authentication, RBAC & Text Reporting
- **Deliverables:**
  - Implement JWT authentication with bcrypt password hashing (`POST /api/auth/login`, `GET /api/auth/me`).
  - Implement fail-fast environment validator in `src/config/env.ts` checking for secure JWT secret.
  - Implement role-enforcement middleware (`requireRole('SUPERVISOR')`, `requireRole('REPORTER_TECHNICIAN')`).
  - Implement incident text creation (`POST /api/reports`) and basic incident retrieval.
  - Implement append-only audit event logging helper (`logAuditEvent()`).
  - Build Reporter UI: text incident submission form.
- **Milestone Gate:** Unit test confirms a Technician receiving HTTP 403 when hitting supervisor endpoints.

### Day 3 (25 Oct 2026): Voice Integration & Transcript Preservation
- **Deliverables:**
  - Audio file upload handler (multipart/form-data with size/format validation and SHA-256 hashing).
  - Sarvam STT API client (`POST /api/reports/:id/transcribe`) with fallback mock service for offline testing.
  - Dual transcript data layer: `original_transcript` (immutable) and `corrected_transcript` (`PATCH /api/reports/:id/transcript`).
  - Reporter UI: Voice recorder widget (HTML5 MediaRecorder API) with real-time waveform/timer and transcript editor.
- **Milestone Gate:** Submitting an audio file preserves original transcription and logs user edits to the audit trail.

### Day 4 (26 Oct 2026): Schema-Constrained AI Extraction & Disambiguation
- **Deliverables:**
  - Structured LLM extraction service using OpenAI / Gemini structured outputs with Zod schema (`POST /api/reports/:id/extract`).
  - Deterministic asset matching service: regex / trigram lookup against seeded `machines` table.
  - Missing-field and ambiguity detection engine:
    - Ambiguity: multiple matching machines -> triggers `AWAITING_CLARIFICATION`.
    - Unknown asset: 0 matching machines -> triggers `AWAITING_CLARIFICATION`, no ID invented.
    - Missing required fields: symptom < 10 chars -> triggers `AWAITING_CLARIFICATION`.
  - Clarification endpoint (`POST /api/reports/:id/clarify`).
  - Frontend: Interactive clarification modal for choosing candidate machines.
- **Milestone Gate:** Test report "Machine 4" correctly produces 2 candidates without hallucinating an asset ID.

### Day 5 (27 Oct 2026): Evidence Labelling, Supervisor Approval & Historical Grounding
- **Deliverables:**
  - Evidence assembler module: tags every field with `REPORTED`, `RETRIEVED`, `SUGGESTED`, or `UNVERIFIED` and source reference.
  - Historical incident retrieval engine: queries PostgreSQL for verified closed incidents on same asset / equipment type.
  - Supervisor approval endpoints:
    - `POST /api/work-orders` (create work order from reviewed incident; status: `AWAITING_APPROVAL`)
    - `POST /api/work-orders/:id/approve` (confirms priority; status: `APPROVED`)
    - `POST /api/work-orders/:id/reject` (reason required; status: `REJECTED`)
    - `POST /api/work-orders/:id/return` (reason required; returns to clarification)
  - PostgreSQL CTE recurring-fault analyzer (`GET /api/graph/recurring`).
  - Frontend: Evidence-labelled Supervisor Review Screen with color-coded provenance tags and historical incident cards.
- **Milestone Gate:** Supervisor can review an evidence-labelled draft, modify priority, and generate an approved work order.

### Day 6 (28 Oct 2026): Technician Execution, Verified Closure & Audit
- **Deliverables:**
  - Technician assignment endpoint (`POST /api/work-orders/:id/assign`). **Precondition check:** Rejects if order is not `APPROVED` with HTTP 400.
  - Execution state machine transitions:
    - `POST /api/work-orders/:id/status` (`IN_PROGRESS`)
    - `POST /api/work-orders/:id/status` (`RESOLVED`, requires findings and resolution summary)
  - Supervisor verification endpoint (`POST /api/work-orders/:id/verify-close`, requires closure notes; HTTP 403 for technicians).
  - Supervisor rework return endpoint (`POST /api/work-orders/:id/return`, requires return reason).
  - Frontend: Technician Task Board and Supervisor Verification & Audit Trail Inspection View.
- **Milestone Gate (P0 Freeze):** Complete end-to-end user journey runs from voice report to verified closure without manual DB edits.

### Day 7 (29 Oct 2026): AI Evaluation Suite & Optional P1 Enhancements
- **Deliverables:**
  - Run the automated evaluation suite against the 30 labelled test reports (`tests/evaluation/run_benchmark.ts`).
  - Compute and log the 8 quantitative metrics (Accuracy, Recall, Precision, Unsupported Machine ID Rate [target 0%], Unsupported Timestamp Rate [target 0%], Unsupported Historical Record Rate [target 0%]).
  - Implement P1 Recurring-Fault Intelligence in Neo4j (if environment permits without blocking P0).
  - Implement P1 Supervisor Analytics Dashboard (Open/Closed counts, MTTR, Top failing equipment types).
- **Milestone Gate:** Evaluation results documented with actual numbers; 0% unsupported claims verified.

### Day 8 (30 Oct 2026): Hardening, Documentation & Video Production
- **Deliverables:**
  - Polish frontend aesthetics: industrial dark mode, fluid micro-interactions, responsive typography.
  - Write comprehensive `README.md`, setup guides, and API documentation.
  - Finalize all unit, integration, and security tests.
  - Execute dry runs of the 3-minute demonstration script.
  - Record the final demo video.
- **Milestone Gate:** Repository ready for public submission with MIT/Apache-2.0 license.

### 31 October 2026: Buffer & Hackathon Submission
- Final defect resolution and verification against submission criteria checklist.

---

## 4. Dependencies, Tooling & Environment Configuration

### 4.1 Backend Dependencies
- `express`, `cors`, `helmet`, `dotenv`: Web server & security middleware.
- `prisma`, `@prisma/client`, `pg`: Database ORM and PostgreSQL driver.
- `jsonwebtoken`, `bcryptjs`: Authentication & password hashing.
- `zod`: Schema validation for API payloads and LLM outputs.
- `multer`: Multipart form-data handling for audio & photo uploads.
- `axios` / `undici`: HTTP client for external AI service calls.
- `vitest`, `supertest`: Automated testing framework.

### 4.2 Frontend Dependencies
- `react`, `react-dom`, `next` (or Vite + React): Core UI framework.
- `lucide-react`: Industrial iconography.
- `clsx`: Design system utilities.

### 4.3 Required Secrets & Safe Environment Configuration

> [!CAUTION]
> **Zero Insecure Defaults:** Never commit secrets, passwords, or usable default keys to the codebase. The application enforces a startup check: if `JWT_SECRET` is missing, shorter than 32 characters, or set to a placeholder, the server will terminate immediately with a fatal error.

#### Generating Safe Secrets Locally:
Run the following in your terminal to generate a secure 256-bit secret:
```bash
openssl rand -base64 32
```

#### Safe `.env.example` Structure (No Plaintext Secrets):
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/kaaryasetu_db"

# Authentication Security (Minimum 32 characters, randomly generated)
JWT_SECRET="<GENERATE_USING_OPENSSL_RAND_BASE64_32>"

# Speech-to-Text Provider (Sarvam AI)
# Leave unset or empty to automatically engage the built-in offline mock stub
SARVAM_API_KEY=""

# LLM Extraction Provider (OpenAI or Gemini API Key)
OPENAI_API_KEY=""
GEMINI_API_KEY=""

# Optional P1 Graph Intelligence (Neo4j)
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER=""
NEO4J_PASSWORD=""

# Server Configuration
PORT=5000
NODE_ENV="development"
```

---

## 5. Architectural Assumptions & Risk Mitigation Strategies

| Risk | Likelihood | Impact | Architectural Mitigation |
|---|---|---|---|
| **Speech recognition failure / network latency** | Medium | High | System provides seamless manual text fallback. If STT fails, raw report is preserved, and user can type without restarting. |
| **LLM hallucinating non-existent machine IDs** | Medium | Critical | Zero-tolerance deterministic validation. The LLM output does NOT write directly to `machine_id`; it outputs `machine_reference` string, which the backend matches against the real database registry. |
| **Neo4j integration complexities derail P0 timeline** | High | Medium | Neo4j is strictly decoupled as a P1 read-model. PostgreSQL CTE queries provide identical recurring-fault intelligence if Neo4j is disabled. |
| **Technician attempts self-approval or closure** | Medium | High | Backend RBAC rejects non-supervisor closure with HTTP 403. Database foreign key `verified_by_id` references users with `SUPERVISOR` role. |
| **Audit log tampering or accidental deletion** | Low | Critical | Database-level trigger rejects all `UPDATE` and `DELETE` commands on `audit_logs`. |
| **Seeded data confused with real factory data** | Low | High | Synthetic data banner prominently displayed across UI; evaluation methodology explicitly discloses synthetic dataset. |

---

## 6. Open Technical Decisions for Review

1. **Audio Recording Container Format:** Standardize on `audio/webm;codecs=opus` for browser MediaRecorder, with backend transcoding to `audio/wav` for Sarvam AI compatibility.
2. **Primary LLM Provider for Extraction:** Gemini 1.5 Flash / Pro vs OpenAI GPT-4o-mini using JSON mode. The service will use a provider-agnostic interface (`IExtractionService`) so switching requires only an environment variable change.
3. **Sarvam AI STT Connectivity:** In development or offline environments where external API credits are limited, the system automatically uses a deterministic mock transcriber that maps recorded audio fixtures to pre-labelled transcripts.
