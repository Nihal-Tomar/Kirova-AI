import { execute30CaseBenchmark } from "../controllers/evaluation";
import { db } from "../db/index";

async function main() {
  console.log("================================================================================");
  console.log("             KIROVA AI — 30-REPORT QUANTITATIVE BENCHMARK RUNNER               ");
  console.log("================================================================================\n");

  await db.init();
  const report = await execute30CaseBenchmark();

  console.log(`Evaluated ${report.totalCases} unique reports across Hindi, Hinglish, and English.\n`);
  console.log("--------------------------------------------------------------------------------");
  console.log("| ID   | Lang     | Primary Category      | Extracted Machine | Status | Halluc? |");
  console.log("--------------------------------------------------------------------------------");

  for (const r of report.results) {
    const machine = r.resolvedMachineTag || (r.isAmbiguous ? "[AMBIGUOUS]" : "[NULL]");
    const halluc = r.passedZeroHallucination ? "CLEAN" : "DETECTED!";
    console.log(
      `| ${r.id.padEnd(4)} | ${r.language.padEnd(8)} | ${r.symptomCategory.padEnd(21)} | ${machine.padEnd(17)} | ${r.initialStatus.substring(0, 6)} | ${halluc.padEnd(7)} |`
    );
  }

  console.log("--------------------------------------------------------------------------------\n");
  console.log("BENCHMARK SUMMARY METRICS:");
  console.log(`- Field-Level Extraction Accuracy:       ${report.fieldLevelExtractionAccuracy}% (Target: >=90%)`);
  console.log(`- Machine Identification Accuracy:       ${report.machineIdentificationAccuracy}% (Target: 100%)`);
  console.log(`- Missing-Information Recall:            ${report.missingInformationRecall}% (Target: >=95%)`);
  console.log(`- Missing-Information Precision:         ${report.missingInformationPrecision}% (Target: >=90%)`);
  console.log(`- Unsupported Machine ID Rate:           ${report.unsupportedMachineIdRate.toFixed(1)}% (Target: 0.0%)`);
  console.log(`- Unsupported Timestamp Rate:            ${report.unsupportedTimestampRate.toFixed(1)}% (Target: 0.0%)`);
  console.log(`- Unsupported Historical Record Rate:    ${report.unsupportedHistoricalRecordRate.toFixed(1)}% (Target: 0.0%)`);
  console.log(`- Authorization Test Pass Rate:          ${report.authorizationTestPassRate}% (Target: 100%)`);
  console.log(`- Workflow Completion Rate:              ${report.workflowCompletionRate}% (Target: 100%)\n`);

  if (
    report.unsupportedMachineIdRate === 0 &&
    report.unsupportedTimestampRate === 0 &&
    report.unsupportedHistoricalRecordRate === 0
  ) {
    console.log("🏆 ZERO HALLUCINATIONS VERIFIED. System refused to invent missing machine data or history.\n");
  } else {
    console.error("❌ Hallucination detected in test run!");
    process.exit(1);
  }

  await db.close();
  process.exit(0);
}

main().catch(err => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
