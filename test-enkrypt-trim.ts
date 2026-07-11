import axios from "axios";
import "dotenv/config";

async function runEnkryptCall(summaryText: string, policyText: string, iteration: number) {
    console.log(`\n--- Call ${iteration} ---`);
    const startTime = performance.now();
    try {
        const response = await axios.post("https://api.enkryptai.com/guardrails/detect", {
            text: summaryText,
            detectors: {
                "policy_violation": {
                    "enabled": true,
                    "policy_text": policyText
                }
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.ENKRYPT_API_KEY
            },
            timeout: 120000 // Use large timeout to see if it eventually succeeds
        });
        const endTime = performance.now();
        console.log(`Latency: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Status: ${response.status}`);
        
        // Ensure we handle Enkrypt's internal timeout (if they return 200 with an error object)
        if (response.data?.details?.policy_violation?.violating_policy === "Error") {
            console.log(`Warning: Enkrypt returned an internal error: ${response.data.details.policy_violation.explanation}`);
        } else {
             console.log(`Success: Got valid response.`);
        }
        return (endTime - startTime);
    } catch (e: any) {
        const endTime = performance.now();
        console.log(`Latency: ${(endTime - startTime).toFixed(2)}ms`);
        if (e.response) {
            console.error(`Status: ${e.response.status}`);
        } else {
            console.error(`Error: ${e.message}`);
        }
        return (endTime - startTime);
    }
}

async function main() {
    console.log("=========================================");
    console.log("ENKRYPT AI ROOT CAUSE DIAGNOSTICS");
    console.log("=========================================");

    const originalFindings = [{
        finding: {
            findingType: "TAINT_FLOW",
            severity: "HIGH",
            filePath: "src/api/auth.js",
            lineNumber: 42,
            snippetHash: "eval(req.body.data)",
            enclosingFunction: "loginHandler",
            sink: "eval",
            source: "req.body"
        }
    }];

    const trimmedFindings = originalFindings.map(f => ({
        findingType: f.finding.findingType,
        severity: f.finding.severity,
        sink: f.finding.sink,
        source: f.finding.source
    }));

    const originalPolicyText = `The response must only reference vulnerabilities present in this findings list: ${JSON.stringify(originalFindings)}. Flag any claim in the response text that references a vulnerability type, severity, or location not present in this list. Strict rule: if the text mentions a vulnerability type name (e.g. 'RCE', 'SQLi') that is not explicitly written in the JSON, it is a policy violation and you must flag it.`;
    
    const trimmedPolicyText = `The response must only reference vulnerabilities present in this findings list: ${JSON.stringify(trimmedFindings)}. Flag any claim in the response text that references a vulnerability type, severity, or location not present in this list. Strict rule: if the text mentions a vulnerability type name (e.g. 'RCE', 'SQLi') that is not explicitly written in the JSON, it is a policy violation and you must flag it.`;

    console.log(`1. PAYLOAD SIZE CHECK`);
    console.log(`   Original policy_text size: ${Buffer.byteLength(originalPolicyText, 'utf8')} bytes`);
    console.log(`   Trimmed policy_text size:  ${Buffer.byteLength(trimmedPolicyText, 'utf8')} bytes`);
    
    const summaryText = "The system is vulnerable to a Critical Remote Code Execution (RCE) via a malicious payload sent to the child_process.exec module, as well as a severe SQL Injection (SQLi) in the users table.";

    console.log(`\n2. RUNNING 3 CONSECUTIVE CALLS (Trimmed Payload)`);
    for (let i = 1; i <= 3; i++) {
        await runEnkryptCall(summaryText, trimmedPolicyText, i);
    }
}

main().catch(console.error);
