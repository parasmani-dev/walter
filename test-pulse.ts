import path from "path";
import { checkDependenciesWithGHSA } from "./src/agents/VulnAnalyzerAgent/tools/ghsaLookup";
import { analyzeTaintFlow } from "./src/agents/VulnAnalyzerAgent/tools/taintFlow";

async function main() {
  const repoPath = path.join(__dirname, "pulse-api");
  const adminFilePath = path.join(repoPath, "src/routes/admin.ts");
  
  console.log("--- 1. Testing taintFlow on pulse-api ---");
  const taintFindings = await analyzeTaintFlow(adminFilePath);
  
  // Just print the finding
  console.log("admin.ts findings:", JSON.stringify(taintFindings, null, 2));
  console.log("ALL taint findings:", JSON.stringify(taintFindings, null, 2));
  
  console.log("\n--- 2. Testing GHSA Lookup on pulse-api ---");
  const ghsaFindings = await checkDependenciesWithGHSA(repoPath);
  console.log(`Found ${ghsaFindings.length} GHSA findings.`);
  ghsaFindings.forEach((f: any) => {
    console.log(`Package: ${f.packageName}, CVE: ${f.cveId}, Severity: ${f.severity}`);
  });
}

main();
