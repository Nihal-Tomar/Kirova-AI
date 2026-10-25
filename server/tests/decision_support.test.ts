import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

const app = createApp();

describe("Decision Support & Evidence Graph Test Suite", () => {
  let supToken: string;
  let incidentId: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    const supRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "Supervisor@123" });
    supToken = supRes.body.token;

    // Report incident on MCH-001 (Conveyor 1)
    const repRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${supToken}`)
      .send({ text: "MCH-001 conveyor belt slipping under heavy load with loud squeal" });
    incidentId = repRes.body.id;

    await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${supToken}`);
  });

  it("produces a 4-way structured decision support report", async () => {
    const res = await request(app)
      .get(`/api/incidents/${incidentId}/decision-support`)
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
    expect(res.body.incidentId).toBe(incidentId);
    expect(res.body.isAdvisoryOnly).toBe(true);
    expect(res.body.options).toHaveLength(4);

    const keys = res.body.options.map((o: any) => o.optionKey);
    expect(keys).toContain("INSPECT");
    expect(keys).toContain("REPAIR");
    expect(keys).toContain("REPLACE_COMPONENT");
    expect(keys).toContain("REPLACE_MACHINE");

    // Machine replacement should be NOT_RECOMMENDED on normal low-recurrence machine
    const replaceMachine = res.body.options.find((o: any) => o.optionKey === "REPLACE_MACHINE");
    expect(replaceMachine.feasibility).toBe("NOT_RECOMMENDED");
    expect(replaceMachine.feasibilityRationale).toContain("UNJUSTIFIED");
  });

  it("builds a source-linked evidence graph with nodes and relationships", async () => {
    const res = await request(app)
      .get(`/api/incidents/${incidentId}/evidence-graph`)
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
    expect(res.body.incidentId).toBe(incidentId);
    expect(res.body.nodes.length).toBeGreaterThan(0);
    expect(res.body.edges.length).toBeGreaterThan(0);

    const nodeTypes = res.body.nodes.map((n: any) => n.type);
    expect(nodeTypes).toContain("INCIDENT");
    expect(nodeTypes).toContain("MACHINE");
    expect(nodeTypes).toContain("COMPONENT");
    expect(nodeTypes).toContain("SOURCE_RECORD");

    const edgeRels = res.body.edges.map((e: any) => e.relationship);
    expect(edgeRels).toContain("OCCURRED_ON");
    expect(edgeRels).toContain("HAS_COMPONENT");
    expect(edgeRels).toContain("PROVENANCE_SOURCE");
  });
});
