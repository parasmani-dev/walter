import { checkDependenciesWithGHSA } from "./src/agents/VulnAnalyzerAgent/tools/ghsaLookup";
import fs from "fs";
import path from "path";
import "dotenv/config";

async function main() {
    const testDir = path.join(__dirname, "test-ghsa-repo");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    
    // Create a package.json with a known vulnerable package (e.g. log4j equivalent or something like old lodash)
    fs.writeFileSync(path.join(testDir, "package.json"), JSON.stringify({
        dependencies: {
            "lodash": "4.17.15" // Known to have prototype pollution CVEs
        }
    }));

    console.log("Running checkDependenciesWithGHSA on test repo...");
    const matches = await checkDependenciesWithGHSA(testDir);
    
    console.log("GHSA Matches:\n", JSON.stringify(matches, null, 2));
    
    // Clean up
    fs.unlinkSync(path.join(testDir, "package.json"));
    fs.rmdirSync(testDir);
}

main().catch(console.error);
