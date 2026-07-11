import axios from "axios";
import "dotenv/config";

async function main() {
    console.log("=========================================");
    console.log("ENKRYPT AI LIVE API TEST (AXIOS w/ TIMEOUT)");
    console.log("=========================================");
    
    const apiKey = process.env.ENKRYPT_API_KEY;
    if (!apiKey || apiKey.includes("your_enkrypt_api_key_here")) {
        console.error("FAIL: ENKRYPT_API_KEY is not set.");
        process.exit(1);
    }

    const serializedFindings = JSON.stringify([{
        finding: {
            findingType: "TAINT_FLOW",
            severity: "HIGH",
            sink: "eval",
            source: "req.body"
        }
    }]);

    const summaryText = "The system is vulnerable to a Critical Remote Code Execution (RCE) via a malicious payload sent to the child_process.exec module, as well as a severe SQL Injection (SQLi) in the users table.";

    console.log("Sending request to Enkrypt AI /guardrails/detect...");
    const startTime = performance.now();
    
    try {
        const response = await axios.post("https://api.enkryptai.com/guardrails/detect", {
            text: summaryText,
            detectors: {
                "policy_violation": {
                    "enabled": true,
                    "policy_text": `The response must only reference vulnerabilities present in this findings list: ${serializedFindings}. Flag any claim in the response text that references a vulnerability type, severity, or location not present in this list. Strict rule: if the text mentions a vulnerability type name (e.g. 'RCE', 'SQLi') that is not explicitly written in the JSON, it is a policy violation and you must flag it.`
                }
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "apikey": apiKey
            },
            timeout: 15000 // 15s timeout
        });
        
        const endTime = performance.now();
        const latency = (endTime - startTime).toFixed(2);
        
        console.log(`\nLatency: ${latency}ms`);
        console.log("\n[RAW JSON RESPONSE]:\n");
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (e: any) {
        const endTime = performance.now();
        console.error(`\n[API EXCEPTION CAUGHT AFTER ${(endTime - startTime).toFixed(2)}ms]:`);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

main().catch(console.error);
