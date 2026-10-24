# Kirova AI — Verification, Testing & Evaluation Plan

**Document Version:** 2.0 (Reconciled with PRD v2.0)  
**Target Event:** HackFront India 2026  
**Guiding Principle:** *Evidence Before Confidence & Measurable Accuracy*  

---

## 1. Testing Strategy Overview

The testing framework for Kirova AI covers three distinct tiers:
1. **Deterministic Software Verification:** Unit, Integration, State Machine, and Security/RBAC tests ensuring strict backend enforcement of business rules and immutable auditability.
2. **AI Extraction & Provenance Benchmarking:** A quantitatively evaluated 30-case synthetic dataset testing multilingual extraction accuracy, ambiguity detection, and zero-hallucination guardrails.
3. **End-to-End Workflow & Demo Validation:** Full lifecycle test running the complete thread from speech ingestion to supervisor-verified closure.

---

## 2. Quantitative AI Evaluation Framework (30-Case Benchmark)

Unlike conventional demos that merely present a single successful prompt, Kirova AI measures extraction reliability using an automated evaluation script (`tests/evaluation/run_benchmark.ts`) running against 30 labelled test reports (`data/evaluation_30_reports.json`).

> [!IMPORTANT]
> **Zero Fabrication Rule:** No evaluation scores or benchmark numbers are fabricated in this specification. All final percentages are computed programmatically by running the benchmark suite against the ground-truth dataset during Phase 7 testing.

### 2.1 Complete 30-Report Ground-Truth Dataset Specification

The evaluation dataset contains **exactly 30 unique labelled reports** across 3 language cohorts (10 Hindi, 10 Hinglish, 10 English). Each case specifies ground-truth inputs, primary categories, overlapping secondary traits, and exact expected outcomes.

| Case ID | Language | Input Report Text | Primary Category | Overlapping Traits | Expected Machine Outcome | Expected Missing Fields | Recurrence Claimed | Expected Grounded History | Expected Initial Status |
|---|---|---|---|---|---|---|---|---|---|
| **TC-01** | Hindi | "MCH-001 conveyor belt motor se aawaz aa rahi hai aur dhuandhar chal rahi hai." | Unambiguous Asset | Technical symptom | `MCH-001` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-02** | Hindi | "CNC Milling 1 ka coolant leak ho raha hai table ke neeche." | Unambiguous Asset | Fluid Leakage | `MCH-002` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-03** | Hindi | "Lathe machine 1 ka chuck jam ho gaya hai aur spindle ghoom nahi raha." | Unambiguous Asset | Mechanical Jam | `MCH-003` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-04** | Hindi | "Machine 4 ka belt ajeeb noise kar raha hai aur ruk gaya hai." | Ambiguous Asset | Hindi + Noise | Multiple (`MCH-004`, `MCH-014`) | `["machine_id"]` | `false` | $\ge 1$ peer records | `AWAITING_CLARIFICATION` |
| **TC-05** | Hindi | "Conveyor belt slip ho raha hai packaging area mein." | Ambiguous Asset | Hindi + Location | Multiple (`MCH-001`, `MCH-004`) | `["machine_id"]` | `false` | $\ge 1$ peer records | `AWAITING_CLARIFICATION` |
| **TC-06** | Hindi | "Machine 99 ka pressure drop ho gaya hai poora." | Unknown Asset | Hindi + Pressure | Zero matches (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-07** | Hindi | "Poori line mein bohot zyada vibration ho rahi hai." | Missing Asset | Hindi + Omitted Machine | Omitted (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-08** | Hindi | "MCH-005 chal nahi raha." | Missing Symptom Details | Short text (< 10 char detail) | `MCH-005` (Single match) | `["symptom_detail"]`| `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-09** | Hindi | "MCH-001 ka motor pehle bhi do baar garam ho chuka hai pichle hafte."| Recurrence Claim | Hindi + Recurrence | `MCH-001` (Single match) | `[]` | `true` | $\ge 2$ verified records | `AWAITING_REVIEW` |
| **TC-10** | Hindi | "MCH-002 ka tool hed [noise] vibration kar raha tha subah se." | Noisy Speech | Phonetic Distortion | `MCH-002` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-11** | Hinglish | "MCH-004 conveyor belt mein heavy friction noise aa rahi hai." | Unambiguous Asset | Hinglish Technical | `MCH-004` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-12** | Hinglish | "MCH-005 hydraulic press ka oil pressure dangerously low ho gaya." | Unambiguous Asset | Hydraulic Failure | `MCH-005` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-13** | Hinglish | "Air compressor 1 trip ho gaya automatically high temp warning ke saath." | Unambiguous Asset | Thermal Trip | `MCH-006` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-14** | Hinglish | "Lathe 2 ka cutting tool loose hai aur vibrate kar raha hai." | Ambiguous Asset | Hinglish + Lathe | Multiple (`MCH-007`, `MCH-008`) | `["machine_id"]` | `false` | $\ge 1$ peer records | `AWAITING_CLARIFICATION` |
| **TC-15** | Hinglish | "Press machine achanak ruk gayi without error code." | Ambiguous Asset | Hinglish + Press | Multiple (`MCH-005`, `MCH-009`) | `["machine_id"]` | `false` | $\ge 1$ peer records | `AWAITING_CLARIFICATION` |
| **TC-16** | Hinglish | "Boiler B ka steam valve leak kar raha hai." | Unknown Asset | Unseeded Asset Type | Zero matches (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-17** | Hinglish | "Workshop floor pe smell aa rahi hai burnt plastic ki." | Missing Asset | Omitted Machine | Omitted (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-18** | Hinglish | "MCH-003 ka display blank hai." | Missing Context | Minimal Information | `MCH-003` (Single match) | `["symptom_detail"]`| `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-19** | Hinglish | "MCH-004 ka belt again slip kar raha hai jaise Monday ko kiya tha." | Recurrence Claim | Hinglish + Explicit Claim| `MCH-004` (Single match) | `[]` | `true` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-20** | Hinglish | "MCH-006 bar bar overheat ho ke shut down ho jata hai." | Recurrence Claim | Frequent Failure | `MCH-006` (Single match) | `[]` | `true` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-21** | English | "MCH-007 Lathe spindle bearing is producing a continuous grinding sound."| Unambiguous Asset | English Precision | `MCH-007` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-22** | English | "MCH-008 Hydraulic Press has a broken pressure gauge seal." | Unambiguous Asset | Seal Failure | `MCH-008` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-23** | English | "Milling machine 2 axis guide is stuck and won't reset." | Ambiguous Asset | English + Milling | Multiple (`MCH-010`, `MCH-011`) | `["machine_id"]` | `false` | $\ge 1$ peer records | `AWAITING_CLARIFICATION` |
| **TC-24** | English | "Main Air Compressor has dropped operating pressure below 4 bar." | Ambiguous Asset | English + Compressor | Multiple (`MCH-006`, `MCH-012`) | `["machine_id"]` | `false` | $\ge 1$ peer records | `AWAITING_CLARIFICATION` |
| **TC-25** | English | "Generator G-4 is emitting black exhaust smoke." | Unknown Asset | Non-existent Asset | Zero matches (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-26** | English | "Packaging Robot 1 gripper failed to clamp part." | Unknown Asset | Non-existent Asset | Zero matches (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-27** | English | "The equipment is not working properly." | Insufficient Info | Zero Specifics | Omitted (null) | `["machine_id", "symptom"]` | `false`| 0 records | `AWAITING_CLARIFICATION` |
| **TC-28** | English | "Machine in Bay C has stopped running completely." | Missing Machine ID | Location Only | Omitted (null) | `["machine_id"]` | `false` | 0 records | `AWAITING_CLARIFICATION` |
| **TC-29** | English | "MCH-007 bearing failure repeated again during afternoon shift." | Recurrence Claim | English + Recurrence | `MCH-007` (Single match) | `[]` | `true` | $\ge 1$ verified records | `AWAITING_REVIEW` |
| **TC-30** | English | "High pitch whirring [static noise] gearbox MCH-001 belt." | Noisy Speech | Audio Distortion | `MCH-001` (Single match) | `[]` | `false` | $\ge 1$ verified records | `AWAITING_REVIEW` |

---

### 2.2 Mathematical Evaluation Metrics & Independent Hallucination Formulations

The benchmark runner measures accuracy and zero-hallucination compliance across 8 distinct metrics:

| Metric Name | Mathematical Formulation | Target Threshold | Architectural Guardrail |
|---|---|---|---|
| **Field-Level Extraction Accuracy** | $\frac{\sum \text{Correct Extracted Labelled Fields}}{\sum \text{Total Labelled Fields}}$ | $\ge 90\%$ | Zod schema constraint |
| **Machine Identification Accuracy** | $\frac{\text{Correct Resolved Assets}}{\text{Total Unambiguous Machine Cases}}$ | $100\%$ | Deterministic SQL lookup |
| **Missing-Information Recall** | $\frac{\text{Correctly Detected Incomplete/Ambiguous Cases}}{\text{Total Ground-Truth Incomplete/Ambiguous Cases}}$ | $\ge 95\%$ | Missing field rule engine |
| **Missing-Information Precision** | $\frac{\text{Correctly Detected Incomplete/Ambiguous Cases}}{\text{Total Flagged Missing/Ambiguous Cases}}$ | $\ge 90\%$ | Controlled ambiguity threshold |
| **Unsupported Machine ID Rate** | $\frac{\text{Fabricated Machine IDs Not In Seed Registry}}{\text{Total Evaluated Reports}}$ | **Strictly 0.0%** | Rejects unseeded IDs |
| **Unsupported Timestamp Rate** | $\frac{\text{Fabricated Timestamps When None Mentioned}}{\text{Total Evaluated Reports}}$ | **Strictly 0.0%** | Enforces null timestamp rule |
| **Unsupported Historical Record Rate** | $\frac{\text{Fabricated Historical Incidents Not In DB}}{\text{Total Evaluated Reports}}$ | **Strictly 0.0%** | Pure SQL-retrieved history |
| **Authorization Test Pass Rate** | $\frac{\text{Passed RBAC Security Tests}}{\text{Total Defined RBAC Tests}}$ | $100\%$ | Backend role middleware |

---

## 3. Comprehensive Requirements Traceability Matrix (RTM)

| PRD Req ID | PRD Requirement Description | Phase | Architecture Section | Implementation File(s) | API Endpoint(s) | Test Suite File |
|---|---|---|---|---|---|---|
| **FR-01** | Authentication & Role Enforcement | P0 | Arch §5 (RBAC) | `src/middleware/auth.ts`, `src/controllers/auth.ts` | `POST /api/auth/login`, `GET /api/auth/me` | `tests/auth_rbac.test.ts` |
| **FR-02** | Voice & Text Incident Reporting | P0 | Arch §7 (Pipeline) | `src/controllers/reports.ts`, `src/services/stt.ts` | `POST /api/reports`, `POST /api/reports/:id/transcribe` | `tests/reports_crud.test.ts` |
| **FR-03** | Transcript Preservation & Human Edits | P0 | Arch §4.3 (`incidents`) | `src/controllers/reports.ts` | `PATCH /api/reports/:id/transcript` | `tests/transcript.test.ts` |
| **FR-04** | Schema-Constrained Structured Extraction | P0 | Arch §7.1 (Zod) | `src/services/llm_extractor.ts`, `src/schemas/extraction.ts` | `POST /api/reports/:id/extract` | `tests/extraction.test.ts` |
| **FR-05** | Missing-Field & Ambiguity Detection | P0 | Arch §7 (Steps 6-8) | `src/services/disambiguation.ts`, `src/services/validation.ts` | `POST /api/reports/:id/clarify` | `tests/ambiguity.test.ts`, `tests/unknown_asset.test.ts`, `tests/missing_fields.test.ts` |
| **FR-06** | 4-Tier Evidence Provenance Labelling | P0 | Arch §1 & §4.3 | `src/services/evidence.ts` | Included in structured draft payload | `tests/evidence_label.test.ts` |
| **FR-07** | Historical Incident Grounded Retrieval | P0 | Arch §8 & §9.1 | `src/services/history.ts` | `GET /api/machines/:id/history` | `tests/history.test.ts` |
| **FR-08** | Work-Order Creation & Supervisor Approval | P0 | Arch §6 & §8 | `src/controllers/work_orders.ts`, `src/services/workflow.ts` | `POST /api/work-orders`, `POST /api/work-orders/:id/approve` | `tests/workflow_fsm.test.ts` |
| **FR-09** | Technician Assignment & Execution Tracking | P0 | Arch §5 & §6 | `src/controllers/work_orders.ts` | `POST /api/work-orders/:id/assign`, `POST /api/work-orders/:id/status` | `tests/technician_workflow.test.ts` |
| **FR-10** | Supervisor-Only Verified Closure | P0 | Arch §1 & §5 | `src/controllers/work_orders.ts` | `POST /api/work-orders/:id/verify-close` | `tests/closure_verification.test.ts` |
| **FR-11** | Immutable Audit Trail & Event Logging | P0 | Arch §10 | `src/services/audit.ts` | `GET /api/audit-logs` | `tests/audit_trail.test.ts` |
| **FR-12** | Failure Recovery & Fallback Modes | P0 | Arch §3 & §7 | `src/services/stt.ts`, `src/services/llm_extractor.ts` | All endpoints (error handling middleware) | `tests/failure_recovery.test.ts`, `tests/malformed_ai.test.ts` |
| **FR-13** | Recurring-Fault Intelligence (Postgres/Neo4j) | P0 / P1| Arch §9.1 & §9.2 | `src/services/recurring_faults.ts` | `GET /api/graph/recurring` | `tests/recurring_faults.test.ts` |
| **FR-14** | Supervisor Operational Dashboard | P1 | Arch §8 | `src/controllers/dashboard.ts` | `GET /api/dashboard` | `tests/dashboard.test.ts` |

---

## 4. Test Suites Implementation Specifications

### 4.1 RBAC & Security Test Suite (`tests/auth_rbac.test.ts`)
- **Test Case 1.1:** `REPORTER_TECHNICIAN` signs in, receives JWT, and accesses `GET /api/work-orders/assigned` (Expected: 200 OK).
- **Test Case 1.2:** `REPORTER_TECHNICIAN` attempts to call `POST /api/work-orders/:id/approve` (Expected: 403 Forbidden).
- **Test Case 1.3:** `REPORTER_TECHNICIAN` attempts to call `POST /api/work-orders/:id/assign` (Expected: 403 Forbidden).
- **Test Case 1.4:** `REPORTER_TECHNICIAN` attempts to call `POST /api/work-orders/:id/verify-close` (Expected: 403 Forbidden).
- **Test Case 1.5:** User from Org A attempts to fetch incident from Org B by spoofing UUID (Expected: 404 Not Found or 403 Forbidden).
- **Test Case 1.6:** Unauthenticated request to protected endpoint (Expected: 401 Unauthorized).

### 4.2 Ambiguity, Unknown Asset & Missing Fields Test Suites
- **`tests/ambiguity.test.ts`:**
  - Submit report with "Machine 4" (matches `MCH-004` and `MCH-014`).
  - *Assertion:* Incident status is `AWAITING_CLARIFICATION`.
  - *Assertion:* `candidate_machines` array contains 2 candidates with IDs, names, and locations.
  - *Assertion:* `machine_id` is strictly `null` (system does not auto-select).
  - Submit clarification with selected ID -> *Assertion:* Status transitions to `AWAITING_REVIEW`.
- **`tests/unknown_asset.test.ts`:**
  - Submit report with "Machine 99" (zero matches in equipment registry).
  - *Assertion:* Incident status is `AWAITING_CLARIFICATION`.
  - *Assertion:* `candidate_machines` is empty; `machine_id` is `null`.
  - *Assertion:* System does not invent or persist an unsupported asset ID.
- **`tests/missing_fields.test.ts`:**
  - Submit report: "Workshop floor pe smell aa rahi hai" (omits machine identifier).
  - *Assertion:* `missing_fields` contains `"machine_id"`.
  - *Assertion:* Status is `AWAITING_CLARIFICATION`.
  - *Assertion:* Attempting to create work order via `POST /api/work-orders` before resolving machine returns HTTP 400 (`CANNOT_CONVERT_UNRESOLVED_INCIDENT`).

### 4.3 Malformed AI & Failure Recovery Test Suite (`tests/malformed_ai.test.ts`)
- **Test Case 3.1 (Malformed JSON):** LLM mock returns invalid JSON string (`"{ machine_reference: ..."` without closing bracket).
  - *Assertion:* Extraction service catches syntax error, records error in incident record, sets review status to `AWAITING_CLARIFICATION`, and does not crash the server.
- **Test Case 3.2 (Schema Violation):** LLM mock returns an illegal enum value (`symptom_category: "EXPLOSION"`).
  - *Assertion:* Zod schema validation rejects payload, falls back to `symptom_category: "OTHER"`, and flags category for supervisor review.
- **Test Case 3.3 (Network Timeout):** STT or LLM provider times out after 10 seconds.
  - *Assertion:* Preserves raw submission record, returns user-friendly error message, and provides text input fallback.

### 4.4 Workflow, Approval & Verified Closure Test Suite (`tests/closure_verification.test.ts`)
- **Test Case 4.1 (Creation):** Supervisor creates WorkOrder from reviewed incident -> transitions to `AWAITING_APPROVAL`.
- **Test Case 4.2 (Assignment Precondition):** Supervisor attempts to assign technician while status is `AWAITING_APPROVAL` (Expected: 400 Bad Request, message: "Work order must be approved before assignment").
- **Test Case 4.3 (Approval):** Supervisor approves work order -> transitions to `APPROVED`, sets `approved_by_id` and `approved_at`.
- **Test Case 4.4 (Assignment):** Supervisor assigns approved work order -> transitions to `ASSIGNED`, sets `assigned_technician_id`.
- **Test Case 4.5 (Execution):** Assigned technician starts task -> transitions to `IN_PROGRESS`.
- **Test Case 4.6 (Resolution Precondition):** Technician attempts to resolve without resolution summary (Expected: 400 Bad Request).
- **Test Case 4.7 (Resolution):** Technician submits resolution summary and findings -> transitions to `RESOLVED`.
- **Test Case 4.8 (Verification Privilege):** Technician attempts to verify closure (Expected: 403 Forbidden).
- **Test Case 4.9 (Supervisor Closure):** Supervisor verifies resolution notes and calls verify-close -> transitions to `VERIFIED_CLOSED`.
- **Test Case 4.10 (Self-Verification Guardrail):** Supervisor who is also assigned as the technician attempts to verify closure (Expected: 403 Forbidden, self-approval rejected).

### 4.5 Audit Trail Immutability Test Suite (`tests/audit_trail.test.ts`)
- **Test Case 5.1 (Append Event):** Triggering report edit, approval, assignment, or closure creates distinct audit entries.
- **Test Case 5.2 (API Immutability):** HTTP `DELETE /api/audit-logs/:id` returns 404 (route does not exist).
- **Test Case 5.3 (Database Immutability):** Raw SQL query `DELETE FROM audit_logs` or `UPDATE audit_logs SET action = 'MODIFIED'` executed against PostgreSQL raises exception `audit_logs table is append-only` and rolls back.

---

## 5. Automated Evaluation Runner (`tests/evaluation/run_benchmark.ts`)

The evaluation runner executes each of the 30 ground-truth test cases through the full pipeline:
```typescript
// Conceptual benchmark execution structure
import evaluationData from "../../data/evaluation_30_reports.json";

export async function runEvaluationBenchmark() {
  const metrics = {
    total: evaluationData.length,
    unsupportedMachineIds: 0,
    unsupportedTimestamps: 0,
    unsupportedHistory: 0,
    ambiguityRecallPassed: 0,
    extractionAccuracyPassed: 0
  };

  for (const testCase of evaluationData) {
    const output = await extractionPipeline.process(testCase.input_text);

    // 1. Independent Machine Hallucination Check
    if (output.machine_id && !testCase.valid_asset_ids.includes(output.machine_id)) {
      metrics.unsupportedMachineIds++;
    }

    // 2. Independent Timestamp Hallucination Check
    if (testCase.expected_missing_fields.includes("reported_time") && output.reported_time !== null) {
      metrics.unsupportedTimestamps++;
    }

    // 3. Independent History Hallucination Check
    const history = await historyService.retrieveForAsset(output.machine_id);
    for (const item of history) {
      if (!isStoredInDatabase(item.id)) {
        metrics.unsupportedHistory++;
      }
    }
  }

  return metrics;
}
```

---

## 6. Pre-Demo Verification Checklist

Prior to presenting the 3-minute live demonstration or submitting the hackathon video, run the following sequence:

- [ ] Database reset and seed script executed (`npm run db:reset && npm run db:seed`).
- [ ] 12 machines, 4 equipment types, and 10 verified past incidents verified in database.
- [ ] Automated test suite executed (`npm test`) with 100% pass rate across RBAC, FSM, Ambiguity, and Audit suites.
- [ ] AI benchmark runner executed (`npm run test:eval`) confirming 0 unsupported machine IDs, 0 unsupported timestamps, and 0 unsupported historical records.
- [ ] End-to-end dry run performed in browser:
  - Voice recording in Hinglish submitted.
  - Transcript edited and verified in audit log.
  - Machine 4 ambiguity resolved interactively.
  - Supervisor approval and assignment verified (precondition enforced).
  - Technician resolution notes submitted.
  - Supervisor verified closure executed.
  - Audit log inspected for complete state diffs.
  - Unknown machine failure case verified without hallucination.
