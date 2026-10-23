import { z } from "zod";

export const SymptomCategoryEnum = z.enum([
  "ABNORMAL_NOISE",
  "OVERHEATING",
  "VIBRATION",
  "FLUID_LEAKAGE",
  "ELECTRICAL_FAULT",
  "MECHANICAL_JAM",
  "SENSOR_FAILURE",
  "PERFORMANCE_DROP",
  "OTHER"
]);

export const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const ExtractionOutputSchema = z.object({
  machine_reference: z.string().nullable().describe("Machine name or number mentioned by worker, or null if omitted"),
  symptom_description: z.string().describe("Exact symptom or failure described in worker's words"),
  symptom_category: SymptomCategoryEnum,
  reported_time_text: z.string().nullable().describe("Time or shift of failure explicitly mentioned, or null"),
  recurrence_claimed: z.boolean().describe("True ONLY if worker explicitly stated this problem happened before"),
  suggested_urgency: PriorityEnum,
  urgency_rationale: z.string().describe("Brief technical explanation for suggested urgency based on symptom severity")
});

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;
