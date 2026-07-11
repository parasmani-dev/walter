import { RepoScanMetadataSchema } from "./src/schema/events";
import { runRegressionMemory } from "./src/agents/RegressionMemoryAgent";
import "dotenv/config";

async function main() {
  const repoUrl = "https://github.com/test/regression-repo.git";
  
  // FINDING FIXTURE
  const findingVulnerable = {
    findingType: "TAINT_FLOW",
    owaspCategory: "API8:2023 Security Misconfiguration",
    severity: "CRITICAL",
    filePath: "app.js",
    lineNumber: 10,
    sink: "exec",
    source: "req.query.cmd",
    snippetHash: "child_process.exec(req.query.cmd)",
    enclosingFunction: "handler"
  };

  console.log("==================================================");
  console.log("COMMIT 1: VULNERABILITY INTRODUCED");
  const result1 = await runRegressionMemory({ repositoryUrl: repoUrl, commitSha: "commit-1", hvtFiles: [], clonePath: "", capHit: false }, [findingVulnerable]);
  console.log("Commit 1 Output:\n", JSON.stringify(result1, null, 2));

  console.log("==================================================");
  console.log("COMMIT 2: VULNERABILITY FIXED");
  // We run the pipeline with an empty array of findings (fixed)
  const result2 = await runRegressionMemory({ repositoryUrl: repoUrl, commitSha: "commit-2", hvtFiles: [], clonePath: "", capHit: false }, []);
  console.log("Commit 2 Output:\n", JSON.stringify(result2, null, 2));

  console.log("==================================================");
  console.log("COMMIT 3: VULNERABILITY REINTRODUCED (REGRESSION TEST)");
  // We reintroduce the EXACT same finding
  const result3 = await runRegressionMemory({ repositoryUrl: repoUrl, commitSha: "commit-3", hvtFiles: [], clonePath: "", capHit: false }, [findingVulnerable]);
  console.log("Commit 3 Output:\n", JSON.stringify(result3, null, 2));
}

main().catch(console.error);
