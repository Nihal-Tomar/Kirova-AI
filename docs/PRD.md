# KaaryaSetu AI
## Product Requirements Document (PRD)

**Product tagline:** From Voice to Verified Action

**Version:** 2.0 — Hackathon MVP Blueprint  
**Event:** HackFront India 2026  
**Theme:** Open Source & Innovation  
**Target users:** Small and medium-sized industrial maintenance teams  
**MVP development window:** 23–31 October 2026  
**Primary objective:** Build a working, measurable prototype that demonstrates reliable maintenance reporting, evidence-backed AI extraction, recurring-fault intelligence, and accountable work-order closure.

---

# 1. Executive Summary

KaaryaSetu AI is a multilingual, AI-assisted industrial maintenance platform that transforms informal machine-failure reports into structured, traceable, and human-approved work orders.

In small factories, workshops, college laboratories, and industrial facilities, maintenance issues are often communicated through verbal instructions, phone calls, messaging applications, or handwritten notes. Critical details get lost, repeated failures are recorded independently, and supervisors lack a reliable way to determine what was reported, what the system retrieved from historical records, and what the AI merely suggested.

KaaryaSetu AI addresses this problem through a unified workflow:

**Voice/Text Report → Transcription → Structured Extraction → Validation → Historical Retrieval → Human Approval → Technician Execution → Evidence Submission → Verified Closure.**

The platform supports Hindi, Hinglish, and English reporting, subject to testing and the capabilities of the selected AI services.

Its defining principle is **evidence before confidence**. Every important field is labelled according to its source, missing or ambiguous information triggers clarification, historical recommendations are grounded in stored records, and only authorized human users can approve and verify work.

Unlike a standalone AI chatbot, KaaryaSetu AI connects language intelligence to a complete maintenance workflow.

## 1.1 Product vision

Make reliable and intelligent maintenance management accessible to small and medium-sized industrial teams without requiring expensive enterprise software, connected machinery, or complex implementation.

## 1.2 Product mission

Reduce information loss and coordination overhead while making maintenance decisions more transparent, historical knowledge more useful, and completed work more accountable.

## 1.3 One-line product proposition

KaaryaSetu AI turns a spoken maintenance complaint into an evidence-labelled, human-approved work order, asks for missing information instead of guessing, and uses verified maintenance history to reveal recurring faults across machines.

---

# 2. Problem Statement

## 2.1 The problem

Industrial maintenance teams frequently rely on unstructured communication to report and resolve equipment problems. These processes create five related challenges.

**1. Information loss:** Reports omit equipment identifiers, symptoms, operating conditions, or previous occurrences.

**2. Language friction:** Workers may communicate naturally in Hindi or Hinglish while supervisors need standardized, searchable maintenance records.

**3. Fragmented maintenance history:** Similar failures across machines are not consistently connected, making previous resolutions difficult to discover.

**4. Unverifiable AI output:** AI-generated summaries can present uncertain or missing information as facts, creating a risk of incorrect work orders.

**5. Weak operational accountability:** Assignments, repair notes, approvals, and verification evidence are often scattered across different communication channels.

## 2.2 Problem hypothesis

If workers can report faults naturally, receive structured incident records, clarify missing information, and move approved tasks through an auditable workflow, maintenance teams will have more complete records and better operational visibility.

If verified historical incidents can also be connected across similar equipment, supervisors may identify useful recurring-fault patterns without depending entirely on individual memory.

These hypotheses must be tested through user interviews and a working pilot. The product must not claim reduced downtime, improved safety, or cost savings before such outcomes are measured.

## 2.3 Initial target environment

The first version is designed for:

- Small manufacturing units.
- Industrial workshops.
- College engineering workshops and laboratories.
- Facility maintenance teams.
- Small industrial service operations.

The prototype will use seeded or synthetic equipment and incident records unless users explicitly consent to the use of real operational data.

---

# 3. Product Goals and Success Definition

## 3.1 Primary goal

Demonstrate that an informal maintenance report can become a structured, evidence-backed, human-approved work order that progresses through execution and verified closure, while the system refuses to fabricate missing machine information or historical evidence.

## 3.2 Supporting goals

- Support voice and text reporting.
- Preserve the original report and editable transcript.
- Extract validated, structured incident fields.
- Detect missing fields, ambiguous assets, and possible duplicates.
- Retrieve relevant historical incidents from actual stored records.
- Distinguish worker-reported facts, retrieved records, AI suggestions, and unresolved information.
- Enforce approval, assignment, and closure permissions on the backend.
- Record every significant edit and workflow transition.
- Evaluate the prototype using a labelled test dataset.
- Demonstrate a recurring-fault graph if the core workflow is stable.

## 3.3 Definition of MVP success

The MVP is successful when a reviewer can submit a voice or text report, correct the transcript, resolve an ambiguous machine reference, inspect evidence-labelled information and actual historical incidents, obtain supervisor approval, assign the task, submit resolution evidence, verify closure, and inspect the complete audit trail.

A successful demonstration must also include at least one failure case in which the system explicitly refuses to invent missing information.

---

# 4. Product Differentiation

KaaryaSetu AI must not claim that voice reporting, AI extraction, or maintenance ticketing is individually novel. Its differentiation lies in how these capabilities are combined and validated.

## 4.1 Evidence-labelled intelligence

Every field in the incident draft must identify its evidential status.

| Label | Meaning | Example |
|---|---|---|
| Reported | Explicitly stated by the worker | “The conveyor stops intermittently.” |
| Retrieved | Obtained from an existing stored record | Asset ID, location, or previous verified incident |
| Suggested | Proposed by AI and awaiting review | Suggested urgency or candidate symptom category |
| Unverified | Not sufficiently confirmed | Unresolved machine identity or unconfirmed repair outcome |

Each field should also retain a source reference where applicable.

**Product value:** The reviewer can distinguish facts from suggestions instead of treating the entire AI response as equally reliable.

## 4.2 Ask, don't guess

When required information is missing or ambiguous, the system asks a targeted clarification question.

For example, if two machines match “Machine 4,” the system must present both candidates and ask the user to select the correct one.

It must not silently select a machine, invent an asset identifier, or manufacture a historical incident.

## 4.3 Cross-machine recurring-fault intelligence

The system connects machines, equipment types, components, symptoms, incidents, and verified resolutions.

This allows the supervisor to explore questions such as:

- Which machines of the same type experienced a similar symptom?
- Which components were involved in those incidents?
- Which recorded resolutions were verified?
- How frequently was a particular resolution associated with verified closure?

The interface must distinguish a historical association from proof that the same repair will work again.

## 4.4 Closed-loop accountability

KaaryaSetu AI follows work beyond initial report generation.

Every work order has a responsible technician, a recorded status history, resolution notes, and a supervisor verification decision.

This creates an auditable connection between the reported problem and the recorded outcome.

---

# 5. Target Users and Permissions

The MVP supports two primary permission groups. The manager dashboard is included within supervisor access rather than introducing a separate role.

## 5.1 Reporter / Technician

The first role covers the person submitting a report and the technician handling assigned work. The interface may expose separate reporting and assigned-task views.

Permissions:

- Submit voice and text reports.
- Review and correct submitted transcripts.
- Respond to clarification questions.
- View permitted incident details.
- Access assigned work orders.
- Update task progress.
- Submit findings, resolution notes, and supported evidence.

Restrictions:

- Cannot approve work orders.
- Cannot approve their own closure as the verifying supervisor.
- Cannot access unauthorized assets or other organizations' records.
- Cannot change workflow state outside permitted transitions.

## 5.2 Supervisor

Permissions:

- Review and edit structured incident drafts.
- Request clarification, reject, or approve reports.
- Set the operational priority.
- Assign or reassign technicians.
- Review work-order progress and history.
- Verify or return completed work.
- Inspect audit events and the maintenance dashboard.

Restrictions:

- Cannot bypass mandatory validation or authorization checks.
- Must record reasons for rejection or return.
- Must not treat AI-generated suggestions as approved maintenance procedures.

## 5.3 Access-control rule

All permissions must be enforced on the backend. Hiding an interface button is not an authorization mechanism.

A direct API request from an unauthorized user must be rejected even if that user manually constructs the request.

---

# 6. MVP Scope and Prioritization

The development strategy is to build one complete vertical workflow before expanding the feature set.

## P0 — Mandatory for the prototype

| Feature | Required outcome |
|---|---|
| Authentication and permissions | Two permission groups with server-side enforcement |
| Seeded equipment registry | 10–15 machines across 3–4 equipment types |
| Text reporting | Create and persist an incident from text |
| Voice reporting | Record or upload supported audio and transcribe it |
| Transcript review | Edit the transcript while preserving the original |
| Structured AI extraction | Generate a validated incident object |
| Missing-field detection | Identify incomplete reports using deterministic rules |
| Ambiguity resolution | Ask the user to choose between candidate machines |
| Evidence labels | Mark fields as Reported, Retrieved, Suggested, or Unverified |
| Historical incident retrieval | Show only actual stored records |
| Supervisor workflow | Approve, reject, return for clarification, and assign |
| Technician workflow | Update status and record findings |
| Verified closure | Require supervisor verification and resolution notes |
| Audit trail | Record edits, assignments, decisions, and status changes |
| Evaluation suite | Run a labelled set of 30 synthetic reports and report actual results |

## P1 — Implement only after P0 is stable

- Neo4j recurring-fault graph.
- Supervisor dashboard.
- Hindi text-to-speech for clarification read-back.
- Photo attachments as resolution evidence.
- Basic notifications and overdue indicators.

## P2 — Future or finale-round extensions

- QR-based machine selection.
- Simulated sensor alerts that create draft reports.
- Additional languages tested end to end.
- Advanced semantic retrieval.
- Offline-first operation.
- CMMS, ERP, inventory, and sensor integrations.

**Scope rule:** If P0 is not stable by day 6, defer P1. A reliable end-to-end workflow is more valuable than several incomplete integrations.

---

# 7. End-to-End User Journey

## Step 1 — Submit a report

A reporter signs in, optionally selects a site or machine, and records a voice message or enters text.

Example:

“Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai.”

## Step 2 — Transcribe and review

For voice reports, the backend sends the supported audio to the configured speech-to-text provider.

The user receives an editable transcript. The original transcript and the corrected version are preserved separately.

If transcription fails, the report remains recoverable and the user can enter the report manually.

## Step 3 — Extract structured fields

The extraction service proposes:

- Machine reference.
- Symptom description.
- Symptom category.
- Reported time, if supplied.
- Recurrence claim, if explicitly stated.
- Potential urgency and rationale.
- Missing information.

The system validates the output against a predefined schema.

## Step 4 — Run deterministic validation

The backend checks required fields, asset existence, ambiguous machine matches, allowed values, and workflow constraints.

If the report refers to an unknown or ambiguous machine, the system asks a clarification question rather than fabricating an answer.

## Step 5 — Show evidence and history

The reporter or supervisor sees the structured draft with evidence labels and any relevant historical incidents.

Retrieved incidents must come from persisted data and include references to the underlying records.

## Step 6 — Review and approve

The supervisor edits incorrect values, confirms the asset and priority, and approves or rejects the report.

Approval is required before the work order can be assigned.

## Step 7 — Assign and execute

The supervisor assigns the approved work order to a technician.

The technician records progress, findings, and the resolution performed.

## Step 8 — Verify closure

The technician submits the task for verification. The supervisor inspects the recorded outcome and accepts it or returns the work for additional action.

Only an authorized supervisor can move the work order into Verified Closed.

## Step 9 — Preserve maintenance knowledge

The system stores the verified outcome and audit history. When the graph feature is implemented, approved incident data can be added to the graph to support recurring-fault queries.

---

# 8. Functional Requirements and Acceptance Criteria

## FR-01 — Authentication and role enforcement

The system must authenticate users and enforce the two permission groups.

**Acceptance criteria:**
- Authorized users can sign in.
- Unauthorized requests return an appropriate error.
- A reporter attempting to approve a work order receives HTTP 403.
- A user cannot access another organization's records by changing a resource ID.
- Passwords and session credentials are handled securely.

## FR-02 — Voice and text reporting

The system must support both voice-based and typed incident submission.

**Acceptance criteria:**
- Both paths create persisted report records.
- The user receives confirmation after successful persistence.
- Supported audio is processed by the configured transcription service.
- Failed transcription preserves the report and provides a text fallback.
- Duplicate submission attempts do not unintentionally create duplicate records.

## FR-03 — Transcript preservation

The system must support transcript correction without losing the original transcript.

**Acceptance criteria:**
- The user can edit the transcript before extraction.
- The original transcript remains stored.
- The edited version is identifiable as a human correction.
- Changes record the user and timestamp.

## FR-04 — Schema-constrained extraction

The system must extract incident information into a validated schema.

**Acceptance criteria:**
- Valid model output is parsed and validated.
- Malformed output is rejected, retried where appropriate, or flagged for manual handling.
- Machine IDs and timestamps are never invented when absent from both the report and stored records.
- Unknown fields remain null or explicitly unresolved.
- The source report remains available for comparison.

## FR-05 — Missing-field and ambiguity detection

The system must identify incomplete or ambiguous required fields.

**Acceptance criteria:**
- Missing required information triggers a targeted clarification question.
- Ambiguous machine matches show the available candidates.
- The system does not arbitrarily select a candidate.
- Clarification responses update the draft and retain the prior context.
- Unresolved mandatory information prevents approval.

## FR-06 — Evidence labels

The system must label extracted and retrieved fields according to their source.

**Acceptance criteria:**
- Each relevant field has a valid evidence label.
- Retrieved fields contain a reference to the stored record.
- Suggested values are clearly marked as unconfirmed.
- Unverified information is not displayed as established fact.
- Reviewers can distinguish original reports, extracted values, and human corrections.

## FR-07 — Historical incident retrieval

The system must retrieve relevant records from the database.

**Acceptance criteria:**
- Exact asset history is retrieved from stored incident records.
- Similar incidents are labelled as potentially related rather than confirmed matches.
- Nonexistent incidents are never fabricated.
- Historical resolutions are described as verified only when a verification record exists.
- Access restrictions apply to historical records.

## FR-08 — Work-order creation and approval

The system must support supervisor review, approval, rejection, and return for clarification.

**Acceptance criteria:**
- Work orders cannot be assigned before approval.
- The supervisor can edit priority and other permitted fields.
- Rejection and return actions record a reason.
- Approval records the approving user and timestamp.
- Invalid transitions are rejected by the backend.

## FR-09 — Assignment and execution

The system must assign approved work orders and track execution.

**Acceptance criteria:**
- Approved work orders can be assigned to eligible technicians.
- Assignment changes are recorded.
- Technicians can update permitted statuses and submit findings.
- Invalid status changes are rejected.
- Every state transition is recorded in the status history.

## FR-10 — Verified closure

The system must enforce supervisor verification before closure.

Allowed primary lifecycle:

Draft → Awaiting Review → Approved → Assigned → In Progress → Resolved → Verified Closed.

Rejection, clarification, and authorized return paths must also be supported.

**Acceptance criteria:**
- Only an authorized supervisor can transition a work order to Verified Closed.
- Resolution notes are required.
- Required evidence must be present when the work-order policy demands it.
- The supervisor can return a resolution for further work.
- Closure records the verifier, timestamp, and outcome.
- Reopening a closed work order requires authorization and a reason.

## FR-11 — Audit trail

The system must preserve significant edits and workflow actions.

**Acceptance criteria:**
- Each relevant event records the actor, timestamp, entity, action, and previous value where applicable.
- Approval, rejection, assignment, reassignment, verification, and status changes are recorded.
- Users cannot modify audit history through ordinary application workflows.
- Audit data can be inspected by authorized supervisors.

## FR-12 — Failure recovery

The system must handle speech timeouts, malformed AI output, unknown assets, duplicate submissions, authorization failures, and database errors.

**Acceptance criteria:**
- Failures produce understandable messages.
- Failed AI processing does not silently discard a saved report.
- Retry operations do not duplicate completed actions.
- Unauthorized requests do not modify records.
- The application distinguishes failed processing from successful processing.

## FR-13 — Recurring-fault intelligence

If the P1 graph is implemented, the system must connect equipment and verified incident history.

**Acceptance criteria:**
- Graph results originate from stored incident and asset records.
- The user can identify machines sharing an equipment type and symptom.
- Component and resolution links are shown only when supported by recorded data.
- Resolution rankings use an explicitly defined metric.
- A graph result never implies that a repair is guaranteed to work on another machine.

## FR-14 — Supervisor dashboard

If the P1 dashboard is implemented, it must summarize operational status.

**Acceptance criteria:**
- Display open and awaiting-review work orders.
- Display recently closed work orders.
- Highlight recurring-fault records when available.
- Derive counts from persisted data.
- Apply authorization and organization filters.

---

# 9. AI and Data Design

## 9.1 Proposed technical stack

| Layer | Proposed implementation |
|---|---|
| Frontend | React or Next.js, TypeScript, responsive UI |
| Backend | Node.js with Express, or an equivalent familiar REST framework |
| Transactional database | PostgreSQL |
| ORM | Prisma or an equivalent database-access layer |
| Speech-to-text | Sarvam AI, subject to current API and language support |
| Structured extraction | Schema-constrained LLM service behind a replaceable interface |
| Graph intelligence | Neo4j, optional P1 |
| File storage | Secure local or object storage appropriate to the prototype |
| Testing | Unit tests, API integration tests, workflow tests, and labelled AI evaluation |

The team should select the stack it can implement and test reliably. No particular framework should be introduced merely for novelty.

## 9.2 Core extraction schema

The following is the logical contract for each report:

| Field | Type | Rule |
|---|---|---|
| report_id | UUID | Generated by the system |
| site_id | String | From authorized session or selection |
| machine_id | String or null | Must resolve to a real stored asset |
| symptom_text | String | Preserve the worker's wording |
| symptom_category | Enum | Select from a controlled list |
| reported_time | Datetime or null | Only populate when supported by input or trusted metadata |
| recurrence_claimed | Boolean | True only when recurrence is explicitly reported |
| missing_fields | String array | Computed by deterministic validation rules |
| urgency_suggestion | Enum and rationale | AI suggestion requiring supervisor review |
| evidence | Structured array | Label, source reference, and relevant field |
| review_status | Enum | Controlled workflow state |

Additional implementation metadata may include the original transcript, corrected transcript, extraction version, processing status, and error details.

## 9.3 Extraction and validation pipeline

The system should use the following order:

1. Persist the original submission.
2. Transcribe audio if necessary.
3. Preserve the transcript and any user corrections.
4. Request structured extraction from the AI service.
5. Parse the output against the schema.
6. Apply deterministic validation and permission-independent business rules.
7. Resolve candidate assets against the database.
8. Calculate missing fields and ambiguity.
9. Retrieve existing incident records.
10. Build the evidence-labelled draft.
11. Require authorized human review before approval.

The LLM must not decide access permissions, approve work orders, or override workflow rules.

## 9.4 PostgreSQL and Neo4j responsibilities

PostgreSQL remains the source of truth for users, machines, incidents, work orders, approvals, status history, and audit records.

Neo4j, if implemented, serves only as a relationship-query layer. It must not replace transactional workflow checks.

Recommended graph model:

**Nodes**
- Machine
- MachineType
- Component
- Symptom
- Incident
- Resolution

**Relationships**
- Machine → OF_TYPE → MachineType
- Machine → HAS_COMPONENT → Component
- Incident → ON → Machine
- Incident → SHOWED → Symptom
- Incident → INVOLVED → Component
- Incident → FIXED_BY → Resolution

Graph data should be added only from appropriately approved records, and resolution verification must be represented explicitly.

If the graph cannot answer useful recurring-fault questions in the live demonstration, defer it and use PostgreSQL queries instead.

---

# 10. API Requirements

The following is the proposed API contract for the MVP.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/reports` | Create a report from text or an audio reference |
| POST | `/api/reports/:id/transcribe` | Transcribe a saved audio report |
| PATCH | `/api/reports/:id/transcript` | Save a corrected transcript |
| POST | `/api/reports/:id/extract` | Generate a structured draft |
| POST | `/api/reports/:id/clarify` | Submit a clarification answer |
| POST | `/api/work-orders` | Create a work order from a reviewed report |
| POST | `/api/work-orders/:id/approve` | Approve a work order |
| POST | `/api/work-orders/:id/reject` | Reject a work order |
| POST | `/api/work-orders/:id/return` | Return a report for clarification or further action |
| POST | `/api/work-orders/:id/assign` | Assign a technician |
| POST | `/api/work-orders/:id/status` | Update a permitted workflow status |
| POST | `/api/work-orders/:id/verify-close` | Verify closure as a supervisor |
| GET | `/api/machines/:id/history` | Retrieve asset history |
| GET | `/api/graph/recurring` | Query recurring-fault relationships, if implemented |
| GET | `/api/dashboard` | Retrieve supervisor dashboard metrics |

Every endpoint must validate input, enforce permissions, handle invalid transitions, and return consistent errors.

Request and response schemas should be documented in the project README or an OpenAPI specification.

---

# 11. Evaluation and Testing Strategy

A core differentiator of KaaryaSetu AI is that it measures whether the AI is correct rather than merely demonstrating that an AI response can be generated.

## 11.1 Evaluation dataset

Create 30 labelled synthetic maintenance reports covering:

- Clear Hindi, Hinglish, and English reports.
- Missing machine identifiers.
- Multiple machines matching the same description.
- Ambiguous symptoms.
- Repeated incidents.
- Unknown machines.
- Noisy or incorrectly transcribed speech.
- Duplicate submissions.
- Missing timestamps.
- Reports containing insufficient information for safe prioritization.

Record the expected structured fields, correct asset references, missing-field labels, and relevant historical incidents for each test case.

Define scoring rules before running the tests.

## 11.2 Evaluation metrics

| Metric | Measurement |
|---|---|
| Field-level extraction accuracy | Correct labelled fields divided by all labelled fields |
| Machine identification accuracy | Correct asset matches divided by unambiguous asset cases |
| Missing-information recall | Correctly detected missing or ambiguous cases divided by all actual missing or ambiguous cases |
| Missing-information precision | Correct missing-information detections divided by all such detections |
| Unsupported-claim rate | Unsupported machine IDs, timestamps, or historical claims divided by reports evaluated |
| Incident retrieval correctness | Correct retrieved records divided by expected relevant records |
| Workflow completion rate | End-to-end runs completed without manual database patching divided by total runs |
| Speech correction burden | Number or proportion of transcript words requiring correction on the test sample |
| Authorization test pass rate | Passed permission tests divided by all defined permission tests |

### Mandatory integrity rule

Report actual numbers, test sample size, failures, and known limitations. Do not fabricate evaluation scores or describe synthetic data as real factory data.

For unsupported machine IDs and invented historical records, the target is zero on the labelled test set. A zero observed rate is evidence about that test set, not a universal guarantee.

---

# 12. Security, Privacy, and Operational Safety

The application must:

- Hash passwords using an appropriate password-hashing algorithm.
- Enforce authorization on every protected backend route.
- Validate all user input and uploaded files.
- Protect API credentials and never expose them in frontend code.
- Avoid logging secrets or unnecessary raw report content.
- Use synthetic or consented data during development and demonstration.
- Define appropriate retention and deletion behavior for audio and attachments.
- Restrict access to transcripts, incident history, and evidence files.
- Display a disclaimer that AI suggestions are not approved maintenance procedures.
- Prevent AI-generated text from bypassing human approval or safety controls.
- Disclose third-party APIs, AI services, and open-source libraries in the submission.

The prototype is a maintenance coordination tool, not an industrial control system or a substitute for qualified technical assessment and workplace safety procedures.

---

# 13. Eight-Day Development Roadmap

## Day 1 — 23 October: Validation and foundation

- Interview 3–5 people who operate or maintain equipment.
- Record the most common reporting problems in a findings note.
- Create the repository and initial architecture.
- Define database tables, extraction schema, and seed data.
- Prepare the 30 labelled test reports.

**Deliverable:** A validated problem hypothesis, initial schema, and reproducible development environment.

## Day 2 — 24 October: Authentication and reporting

- Implement login and backend permissions.
- Seed 10–15 machines across 3–4 equipment types.
- Implement text reporting and incident CRUD.
- Add the first audit events.

**Deliverable:** Users can sign in and create persisted text reports.

## Day 3 — 25 October: Voice integration

- Integrate the supported Sarvam speech-to-text API.
- Build the audio recording or upload interface.
- Implement editable transcripts and original transcript preservation.
- Test error handling and text fallback.

**Deliverable:** A voice report can become an editable, persisted transcript.

## Day 4 — 26 October: AI extraction

- Implement structured extraction.
- Add schema validation.
- Build missing-field detection.
- Resolve machine candidates against the equipment registry.

**Deliverable:** Reports become structured drafts and ambiguous machine references trigger clarification.

## Day 5 — 27 October: Evidence and approval

- Add evidence labels.
- Implement historical incident lookup.
- Build supervisor review, rejection, return, approval, and assignment.
- Enforce legal workflow transitions.

**Deliverable:** A supervisor can review and approve an evidence-labelled work order.

## Day 6 — 28 October: Execution and audit

- Implement technician task views and status updates.
- Add resolution notes.
- Implement supervisor verification and closure.
- Test role permissions and audit history.
- Run the first full end-to-end demonstration.

**Deliverable:** The P0 workflow reaches Verified Closed without manual database intervention.

## Day 7 — 29 October: Evaluation and optional graph

- Run the 30-report evaluation.
- Fix critical extraction and workflow defects.
- Implement the Neo4j graph slice only if the core workflow is stable.
- Build the basic supervisor dashboard if time permits.

**Deliverable:** Recorded evaluation results and a stable demonstration.

## Day 8 — 30 October: Release preparation

- Improve responsive layouts and empty/error states.
- Complete automated tests and API documentation.
- Prepare the README, architecture diagram, and open-source license.
- Record the demonstration video.
- Document known limitations.

**Deliverable:** A reproducible prototype with evidence-backed claims.

## 31 October: Buffer and submission

- Resolve critical defects.
- Validate deployment and demonstration access.
- Confirm the applicable submission deadline and requirements.
- Submit before the confirmed deadline.

The schedule is a target, not a guarantee. P1 features must be cut if they threaten P0 stability.

---

# 14. Team Responsibilities

For a team of four or five generalists, assign clear owners while keeping the architecture simple.

| Workstream | Responsibilities |
|---|---|
| Backend and workflow | API, database, permissions, state machine, audit history |
| AI integration | Speech service, structured extraction, validation, failure handling |
| Frontend | Reporting UI, transcript editing, evidence labels, supervisor and technician views |
| Data and evaluation | Equipment seed data, incident history, labelled dataset, metrics, user interviews |
| Integration and submission | End-to-end testing, README, architecture diagram, demo script, pitch |

In a four-person team, combine integration and submission with one of the other workstreams. Every member should understand the complete demo flow.

---

# 15. Three-Minute Demonstration Script

The demonstration should prove the product's central claim rather than show a large number of disconnected screens.

**0:00–0:25 — Voice reporting**

A worker submits a noisy Hinglish report about “Machine 4” experiencing unusual noise and intermittent stoppage.

**0:25–0:45 — Transcript review**

Show the transcript and correct one transcription error. Demonstrate that the original report remains preserved.

**0:45–1:05 — Ask, don't guess**

Show that multiple assets match “Machine 4.” The system asks which machine is intended instead of silently selecting one.

**1:05–1:30 — Evidence-labelled intelligence**

Show the structured report with Reported, Retrieved, Suggested, and Unverified labels. Open a real seeded historical incident.

**1:30–1:50 — Recurring-fault intelligence**

If Neo4j is implemented, show a relevant cross-machine relationship and a supervisor-verified historical resolution. Otherwise, demonstrate the corresponding database-backed history view.

**1:50–2:20 — Execution and closure**

The supervisor approves and assigns the work order. The technician records the resolution, and the supervisor verifies closure.

**2:20–2:40 — Accountability**

Open the audit trail to show the recorded actions, actors, and timestamps.

**2:40–3:00 — Failure handling and evidence**

Submit or display an unknown-machine case. Demonstrate that the system asks for clarification and does not invent an asset or historical record. End with actual evaluation results and limitations.

The demonstration must use working features and seeded records, clearly identified as demonstration data. Do not simulate a capability and present it as a live integration.

---

# 16. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Eight-day scope is too ambitious | Prioritize a complete vertical slice and defer P1 immediately if needed. |
| Speech recognition performs poorly in factory noise | Test early, retain transcript editing, and provide text fallback. |
| AI invents fields or history | Apply schema validation, deterministic rules, evidence labels, and unsupported-claim testing. |
| Neo4j consumes too much time | Keep it optional and retain PostgreSQL as the source of truth. |
| Product appears to be generic voice ticketing | Lead the demonstration with evidence labels, clarification, historical grounding, and verified closure. |
| Seeded data is mistaken for real industry evidence | Clearly label synthetic data and distinguish it from interview findings. |
| Real users do not confirm the problem | Document feedback honestly and adapt the workflow to the evidence. |
| API limits or service changes block the demo | Verify current provider documentation and prepare deterministic test fixtures. |
| Authorization defects allow improper closure | Test backend permissions and illegal workflow transitions automatically. |
| Team makes unsupported impact claims | Report measured results and state what remains unproven. |

---

# 17. Hackathon Submission Requirements

Before submission, verify the following:

- [ ] Registration and theme requirements are satisfied.
- [ ] The problem statement is supported by user-interview findings.
- [ ] The working prototype or demonstration video is accessible.
- [ ] The repository contains a clear README and setup instructions.
- [ ] The architecture and API contracts are documented.
- [ ] The repository includes an appropriate open-source license.
- [ ] Evaluation results include the sample size, actual scores, and limitations.
- [ ] Workflow and authorization tests are included.
- [ ] AI services and third-party dependencies are disclosed.
- [ ] The demonstration stays within the required duration.
- [ ] Any graph feature shown in the demo genuinely runs against the implemented data.
- [ ] The team has confirmed organizer requirements, judging format, and applicable deadlines.

---

# 18. Future Roadmap

## Stage 2 — Stronger maintenance intelligence

- Better multilingual extraction.
- Improved semantic retrieval.
- Recurring-fault analysis.
- Equipment and component relationship graphs.
- Configurable escalation and overdue rules.

## Stage 3 — Industrial workflow integration

- QR-based asset selection.
- SMS or WhatsApp notifications.
- CMMS and ERP integrations.
- Inventory and spare-parts availability.
- Offline-first reporting and synchronization.

## Stage 4 — Sensor-assisted maintenance

- Simulated and eventually authorized real sensor integrations.
- Anomaly detection.
- Failure-risk estimation based on validated historical data.
- Maintenance scheduling based on observed operating conditions.

These stages should be pursued only after the core workflow demonstrates usability and data quality.

---

# 19. Final Product Definition

KaaryaSetu AI is an evidence-first, multilingual industrial maintenance platform that converts informal reports into structured incidents, connects them to real equipment and historical records, and moves approved work through accountable execution and supervisor-verified closure.

Its differentiator is not that AI can write a maintenance summary. It is that the system can distinguish reported facts from retrieved evidence and unverified suggestions, ask for clarification when necessary, and preserve a complete record of the human decisions that turn a complaint into a verified outcome.

**Product promise: Every report is traceable. Every approved task has an owner. Every historical recommendation has a source. Every verified closure has an accountable decision.**

**End of PRD.**
