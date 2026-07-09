
export async function runEnkryptRiskScoreCheck(
  findingsContext: any
): Promise<{ verdict: "PASS" | "FAIL", confidence: number, message?: string, compliance_mapping?: any }> {
  const apiKey = process.env.ENKRYPT_API_KEY;
  if (!apiKey) {
    console.warn("[ValidationAgent] WARNING: ENKRYPT_API_KEY not set. Stubbing Risk Score Check as PASS.");
    return { verdict: "PASS", confidence: 1.0, message: "Stubbed - No API Key" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch("https://api.enkryptai.com/guardrails/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
      },
      body: JSON.stringify({
        text: JSON.stringify(findingsContext),
        detectors: { "injection_attack": { "enabled": true }, "policy_violation": { "enabled": true, "policy_text": "Do not expose secrets or vulnerabilities" }, "pii": { "enabled": true, "entities": ["PERSON", "EMAIL"] } }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[ValidationAgent] Enkrypt API error: ${response.status} - ${errorText}`);
      return { verdict: "FAIL", confidence: 0.0, message: "Guardrail: Unable to verify (timeout or API error)" };
    }

    const data: any = await response.json();
    
    // Handle Enkrypt's internal timeout where it returns 200 OK but with an Error explanation
    const details = data.details || {};
    for (const key of Object.keys(details)) {
      if (details[key]?.violating_policy === "Error" || details[key]?.explanation?.includes("timeout")) {
         console.warn(`[ValidationAgent] Enkrypt internal error/timeout detected in risk check.`);
         return { verdict: "FAIL", confidence: 0.0, message: "Guardrail: Unable to verify (timeout)" };
      }
    }

    // Check if any detector failed or found a violation
    const violations = data.detections || [];
    const isSafe = violations.length === 0;

    return {
      verdict: isSafe ? "PASS" : "FAIL",
      confidence: data.score ?? 1.0,
      message: isSafe ? "Risk checks passed." : `High Risk detected: ${violations.map((v: any) => v.detector).join(", ")}`,
      compliance_mapping: data.compliance_mapping
    };

  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[ValidationAgent] Enkrypt request failed: ${err.message}`);
    return { verdict: "FAIL", confidence: 0.0, message: "Guardrail: Unable to verify (timeout)" };
  }
}
