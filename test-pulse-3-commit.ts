require("dotenv").config();
import { runRepoScanner } from "./src/agents/RepoScannerAgent";
import { runSecretDetector } from "./src/agents/SecretDetectorAgent";
import { runVulnAnalyzer } from "./src/agents/VulnAnalyzerAgent";
import { runRegressionMemory } from "./src/agents/RegressionMemoryAgent";
import fs from "fs";
import path from "path";

async function runPipeline(commitPass: string, repoUrl: string) {
  console.log(`\n=============================\nStarting Pipeline: ${commitPass}\n=============================`);
  const { metadata: repoMetadata, cleanup } = await runRepoScanner(repoUrl);
  repoMetadata.commitSha = commitPass; 

  const adminTsPath = path.join(repoMetadata.clonePath, "src/routes/admin.ts");
  
  if (commitPass === "commit-1") {
    fs.writeFileSync(adminTsPath, `
import { Router } from 'express';
import { exec } from 'child_process';
const router = Router();
router.get('/debug/run', (req, res) => {
  const command = req.query.command as string;
  exec(command, (error, stdout, stderr) => { res.send(stdout); });
});
export default router;
    `);
  } else if (commitPass === "commit-2") {
    fs.writeFileSync(adminTsPath, `
import { Router } from 'express';
const router = Router();
router.get('/debug/run', (req, res) => {
  res.send('Debug disabled');
});
export default router;
    `);
  } else if (commitPass === "commit-3") {
    fs.writeFileSync(adminTsPath, `
import { Router } from 'express';
import { exec } from 'child_process';
const router = Router();
router.get('/debug/run', (req, res) => {
  const userPayload = req.query.payload as string;
  exec(userPayload, (error, stdout, stderr) => { res.send(stdout); });
});
export default router;
    `);
  }

  // Ensure admin.ts is scanned
  repoMetadata.hvtFiles.push("src/routes/admin.ts");

  const secrets = await runSecretDetector(repoMetadata);
  const vulns = await runVulnAnalyzer(repoMetadata);
  
  const allFindings = [...secrets, ...vulns];
  const regressions = await runRegressionMemory(repoMetadata, allFindings);
  
  console.log(`\n[RegressionMemoryAgent] Output for ${commitPass} (admin.ts TAINT_FLOW):`);
  console.log(JSON.stringify(regressions.filter(r => r.finding.findingType === "TAINT_FLOW" && r.finding.filePath.includes("admin.ts")), null, 2));

  cleanup();
}

async function main() {
  const repoUrl = "https://github.com/parasmani-dev/pulse-api.git";
  await runPipeline("commit-1", repoUrl);
  await runPipeline("commit-2", repoUrl);
  await runPipeline("commit-3", repoUrl);
  console.log("Cleanup complete.");
}

main().catch(console.error);
