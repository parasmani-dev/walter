import { runEnkryptHallucinationCheck } from "./src/agents/ValidationAgent/tools/enkryptHallucination";
import "dotenv/config";

async function main() {
    console.log("=========================================");
    console.log("ENKRYPT AI LIVE API TEST");
    console.log("=========================================");
    
    if (!process.env.ENKRYPT_API_KEY || process.env.ENKRYPT_API_KEY.includes("your_enkrypt_api_key_here")) {
        console.error("FAIL: ENKRYPT_API_KEY is not set or is still the default placeholder in .env");
        process.exit(1);
    }

    const mockFindings = [
        {
            finding: {
                findingType: "TAINT_FLOW",
                severity: "HIGH",
                sink: "eval",
                source: "req.body"
            }
        }
    ];

    // A completely hallucinated summary referencing something NOT in the findings
    const hallucinatedSummary = "The system is vulnerable to a Critical Remote Code Execution (RCE) via a malicious payload sent to the child_process.exec module, as well as a severe SQL Injection (SQLi) in the users table.";

    console.log("Findings Context (Ground Truth):", JSON.stringify(mockFindings));
    console.log("Hallucinated Summary (Test Target):", hallucinatedSummary);
    console.log("\nSending request to Enkrypt AI /guardrails/detect...");
    
    const startTime = performance.now();
    try {
        const result = await runEnkryptHallucinationCheck(hallucinatedSummary, mockFindings);
        const endTime = performance.now();
        const latency = (endTime - startTime).toFixed(2);
        
        console.log(`\nLatency: ${latency}ms`);
        console.log(`Final Verdict from Agent: ${result.verdict}`);
        console.log(`Message: ${result.message}`);
        
    } catch (e: any) {
        console.error("\n[EXCEPTION CAUGHT]:", e.message);
    }
}

main().catch(console.error);
