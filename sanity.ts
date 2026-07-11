import { runSecretDetector } from "./src/agents/SecretDetectorAgent";
import fs from "fs";
import path from "path";

async function main() {
  const testPath = path.join(__dirname, "test-aws-secret.js");
  fs.writeFileSync(testPath, `const aws_secret = "AKIAIOSFODNN7EXAMPLE";\n`);
  
  const secrets = await runSecretDetector({ clonePath: __dirname, hvtFiles: [] } as any);
  console.log(JSON.stringify(secrets.filter(s => s.filePath.includes("test-aws-secret")), null, 2));
  fs.unlinkSync(testPath);
}

main();
