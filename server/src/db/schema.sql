-- KaaryaSetu AI PostgreSQL Schema
-- Reconciled with PRD v2.0 and Architecture v2.0

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sites
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('REPORTER_TECHNICIAN', 'SUPERVISOR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Machines
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    asset_tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CONVEYOR', 'CNC_MILLING', 'LATHE', 'HYDRAULIC_PRESS', 'COMPRESSOR', 'PUMP')),
    model_number TEXT,
    serial_number TEXT,
    location TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Components
CREATE TABLE IF NOT EXISTS components (
    id TEXT PRIMARY KEY,
    machine_id TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    part_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    report_number TEXT UNIQUE NOT NULL,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    site_id TEXT NOT NULL REFERENCES sites(id),
    machine_id TEXT REFERENCES machines(id),
    input_channel TEXT NOT NULL CHECK (input_channel IN ('VOICE', 'TEXT')),
    audio_file_path TEXT,
    audio_sha256 TEXT,
    original_transcript TEXT,
    corrected_transcript TEXT,
    transcript_edited_by_id TEXT REFERENCES users(id),
    symptom_text TEXT NOT NULL,
    symptom_category TEXT NOT NULL CHECK (symptom_category IN (
        'ABNORMAL_NOISE', 'OVERHEATING', 'VIBRATION', 'FLUID_LEAKAGE',
        'ELECTRICAL_FAULT', 'MECHANICAL_JAM', 'SENSOR_FAILURE',
        'PERFORMANCE_DROP', 'OTHER'
    )),
    reported_time TIMESTAMP WITH TIME ZONE,
    recurrence_claimed BOOLEAN DEFAULT FALSE,
    urgency_suggestion TEXT CHECK (urgency_suggestion IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    urgency_rationale TEXT,
    missing_fields TEXT, -- JSON string array
    clarification_question TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'DRAFT', 'AWAITING_CLARIFICATION', 'AWAITING_REVIEW',
        'REJECTED', 'CONVERTED_TO_WORK_ORDER'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Incident Evidence (Provenance Tracking)
CREATE TABLE IF NOT EXISTS incident_evidence (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    label TEXT NOT NULL CHECK (label IN ('REPORTED', 'RETRIEVED', 'SUGGESTED', 'UNVERIFIED')),
    raw_value TEXT,
    source_reference TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY,
    work_order_number TEXT UNIQUE NOT NULL,
    incident_id TEXT UNIQUE NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    machine_id TEXT NOT NULL REFERENCES machines(id),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT NOT NULL CHECK (status IN (
        'AWAITING_APPROVAL', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS',
        'RESOLVED', 'VERIFIED_CLOSED', 'REJECTED', 'RETURNED_FOR_REWORK'
    )),
    approved_by_id TEXT REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    assigned_technician_id TEXT REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    technician_findings TEXT,
    resolution_summary TEXT,
    component_id TEXT REFERENCES components(id),
    verified_by_id TEXT REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    supervisor_closure_notes TEXT,
    rejection_reason TEXT,
    return_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Work Order Status History
CREATE TABLE IF NOT EXISTS work_order_status_history (
    id TEXT PRIMARY KEY,
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    changed_by_id TEXT NOT NULL REFERENCES users(id),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs (Append-Only Event Stream)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_state TEXT, -- JSON string
    new_state TEXT,      -- JSON string
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_machines_asset_tag ON machines(asset_tag);
CREATE INDEX IF NOT EXISTS idx_machines_site_id ON machines(site_id);
CREATE INDEX IF NOT EXISTS idx_incidents_machine_id ON incidents(machine_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_technician ON work_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Append-Only Defensive Trigger for audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs table is append-only. Modification and deletion are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_tampering();
