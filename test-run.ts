import { runRepoScanner } from "./src/agents/RepoScannerAgent";
import { runSecretDetector } from "./src/agents/SecretDetectorAgent";
import fs from "fs";
import path from "path";

async function main() {
  const targetRepo = "https://github.com/auth0/express-jwt.git";

  console.log(`Starting Feature 1-3 Workflow Test on ${targetRepo}...`);
  try {
    const { metadata: repoMetadata, cleanup } = await runRepoScanner(targetRepo);
    console.log("[RepoScannerAgent] Workflow Success! Output:");
    console.log(JSON.stringify(repoMetadata, null, 2));
    
    // Inject some fake secrets into the cloned repo to test SecretDetectorAgent
    const testFilePath = path.join(repoMetadata.clonePath, "test-secrets-fixture.js");
    fs.writeFileSync(testFilePath, `
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
      const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const privateKey = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDK\\n-----END PRIVATE KEY-----";
      const dbUrl = "postgres://admin:superSecretPassword123@localhost:5432/db";
      const randomHighEntropy = "xQ3!v9$mPzL@7kY#2wN*8jF^cR5&bT1"; 
      const lowEntropy = "aaaaaaaabbbbbbbbccccccccdddddddd";
    `);
    
    // Add to HVT so it gets scanned first
    repoMetadata.hvtFiles.push("test-secrets-fixture.js");

    const secrets = await runSecretDetector(repoMetadata);
    console.log("[SecretDetectorAgent] Workflow Success! Output:");
    console.log(JSON.stringify(secrets, null, 2));
    
    cleanup();
    console.log("Cleanup complete.");
  } catch (err) {
    console.error("Workflow Failed:", err);
    process.exit(1);
  }
}

main();
