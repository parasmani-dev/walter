require('dotenv').config();
const { execSync } = require('child_process');

const key = process.env.ENKRYPT_API_KEY;
if (!key) {
    console.error("No API key found.");
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

const hallucinatedSummary = "The system is vulnerable to a Critical Remote Code Execution (RCE) via a malicious payload sent to the child_process.exec module, as well as a severe SQL Injection (SQLi) in the users table.";
const policyText = `The response must only reference vulnerabilities present in this findings list: ${JSON.stringify(mockFindings)}. Flag any claim in the response text that references a vulnerability type, severity, or location not present in this list. Strict rule: if the text mentions a vulnerability type name (e.g. 'RCE', 'SQLi') that is not explicitly written in the JSON, it is a policy violation and you must flag it.`;

try {
    const payload = JSON.stringify({
        text: hallucinatedSummary,
        detectors: {
            policy_violation: {
                enabled: true,
                policy_text: policyText
            }
        }
    });
    
    require('fs').writeFileSync('curl_payload_hallucinated.json', payload);

    console.log("Running curl with hallucinated payload...");
    const out = execSync(`curl.exe -X POST https://api.enkryptai.com/guardrails/detect -H "Content-Type: application/json" -H "apikey: ${key}" -d @curl_payload_hallucinated.json -w "\\nTime: %{time_total}s\\n" -m 120`).toString();
    console.log("Response:", out);
} catch (e) {
    console.error('cURL Error:', e.message);
    if (e.stdout) console.error("STDOUT:", e.stdout.toString());
    if (e.stderr) console.error("STDERR:", e.stderr.toString());
}
