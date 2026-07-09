
export async function runEnkryptHallucinationCheck(
  summaryText: string,
  findingsContext: any
): Promise<{ verdict: "PASS" | "FAIL", confidence: number, message?: string }> {
  const apiKey = process.env.ENKRYPT_API_KEY;
  if (!apiKey) {
    console.warn("[ValidationAgent] WARNING: ENKRYPT_API_KEY not set. Stubbing Hallucination Check as PASS.");
    return { verdict: "PASS", confidence: 1.0, message: "Stubbed - No API Key" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const serializedFindings = JSON.stringify(findingsContext.map((f: any) => f.finding || f));
    const response = await fetch("https://api.enkryptai.com/guardrails/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
      },
      body: JSON.stringify({
        text: summaryText,
        detectors: {
          "policy_violation": {
            "enabled": true,
            "policy_text": `The response must only reference vulnerabilities present in this findings list: ${serializedFindings}. Flag any claim in the response text that references a vulnerability type, severity, or location not present in this list. Strict rule: if the text mentions a vulnerability type name (e.g. 'RCE', 'SQLi') that is not explicitly written in the JSON, it is a policy violation and you must flag it.`
          }
        }
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
    console.log(`[ValidationAgent] Enkrypt full response:`, JSON.stringify(data, null, 2));
    
    const policyViolationDetail = data.details?.policy_violation;

    // Handle Enkrypt's internal timeout where it returns 200 OK but with an Error explanation
    if (policyViolationDetail?.violating_policy === "Error" || policyViolationDetail?.explanation?.includes("timeout")) {
      console.warn(`[ValidationAgent] Enkrypt internal error/timeout detected.`);
      return { verdict: "FAIL", confidence: 0.0, message: "Guardrail: Unable to verify (timeout)" };
    }

    const isHallucinated = policyViolationDetail?.policy_violated === true;
    
    return {
      verdict: isHallucinated ? "FAIL" : "PASS",
      confidence: policyViolationDetail?.score ?? 1.0,
      message: isHallucinated ? "Hallucinated claim detected by policy_violation" : "No hallucination detected"
    };

  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[ValidationAgent] Enkrypt request failed: ${err.message}`);
    // If it was aborted due to our 5s timeout, err.name will often be 'AbortError'
    return { verdict: "FAIL", confidence: 0.0, message: "Guardrail: Unable to verify (timeout)" };
  }
}
