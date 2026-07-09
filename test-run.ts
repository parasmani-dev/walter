require("dotenv").config();
import { runRepoScanner } from "./src/agents/RepoScannerAgent";
import { runSecretDetector } from "./src/agents/SecretDetectorAgent";
import { runVulnAnalyzer } from "./src/agents/VulnAnalyzerAgent";
import { runRegressionMemory } from "./src/agents/RegressionMemoryAgent";
import { processValidation } from "./src/agents/ValidationAgent";
import fs from "fs";
import path from "path";

async function runPipeline(commitPass: string, repoUrl: string) {
  console.log(`\n=============================\nStarting Pipeline: ${commitPass}\n=============================`);
  const { metadata: repoMetadata, cleanup } = await runRepoScanner(repoUrl);
  repoMetadata.commitSha = commitPass; // Override for testing

  const secrets = await runSecretDetector(repoMetadata);
  console.log("SECRETS FOUND:", secrets.map(s => s.filePath));

  // Inject fake vulnerable dependencies and taint-flow file
  const testPkgPath = path.join(repoMetadata.clonePath, "package.json");
  fs.writeFileSync(testPkgPath, JSON.stringify({
    name: "test-vuln-app",
    dependencies: {
      "lodash": "4.17.15" // known CVEs in GHSA
    }
  }));
  
  const testTaintPath = path.join(repoMetadata.clonePath, "test-taint-fixture.js");
  if (commitPass === "commit-1") {
    // Original vulnerability
    fs.writeFileSync(testTaintPath, `
      const express = require('express');
      const app = express();
      const child_process = require('child_process');
      app.get('/vuln', (req, res) => {
        child_process.exec(req.query.cmd, (err, stdout) => { res.send(stdout); });
        eval(req.query.cmd);
      });
    `);
  } else {
    // In commit-2, we add an unrelated line to shift the exec vulnerability down by one line.
    // The eval vulnerability is removed. A new db.query vulnerability is added.
    fs.writeFileSync(testTaintPath, `
      const express = require('express');
      const app = express();
      const child_process = require('child_process');
      const db = require('db');
      app.get('/vuln', (req, res) => {
        console.log("UNRELATED SHIFT LINE"); // SHIFTS EVERYTHING DOWN
        child_process.exec(req.query.cmd, (err, stdout) => { res.send(stdout); });
        db.query("SELECT * FROM users WHERE id=" + req.query.id); // NEW
      });
    `);
  }

  repoMetadata.hvtFiles.push("test-taint-fixture.js");

  const vulns = await runVulnAnalyzer(repoMetadata);
  
  const allFindings = [...secrets, ...vulns];
  const regressions = await runRegressionMemory(repoMetadata, allFindings);
  
  console.log(`\n[RegressionMemoryAgent] Workflow Success! Output for ${commitPass}:`);
  console.log(JSON.stringify(regressions.filter(r => r.finding.findingType === "TAINT_FLOW"), null, 2));

  const { calculateScore } = require("./src/agents/ReportSynthesizerAgent/tools/scoreCalculator");
  const finalScore = calculateScore(regressions);
  console.log(`\n[ScoreCalculator] FINAL SCORE for ${commitPass}: ${finalScore.numericScore} (Grade ${finalScore.letterGrade})`);

  // Feature 6: Enkrypt + Zod Validation
  const malformedFinding = { badField: "no-schema-match", data: 123 }; // Should fail Zod
  const validationInput = [...regressions, malformedFinding];
  const fakeSummary = commitPass === "commit-2" 
    ? "Analysis complete. Found a Critical Remote Code Execution (RCE) vulnerability!" 
    : ""; // "RCE" isn't in findings (it's SQLi and exec), so Enkrypt should flag hallucination on commit-2.

  const validationResults = await processValidation(validationInput, fakeSummary);
  console.log(`\n[ValidationAgent] Final Results for ${commitPass}:`);
  console.log(JSON.stringify(validationResults, null, 2));

  cleanup();
}

async function main() {
  const repoUrl = "https://github.com/Durgeshwar-AI/pdfToPng.git";
  await runPipeline("commit-1", repoUrl);
  await runPipeline("commit-2", repoUrl);
  console.log("Cleanup complete.");
}

main().catch(console.error);
