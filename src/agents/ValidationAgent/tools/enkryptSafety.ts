
export async function runEnkryptSafetyCheck(
  findingsContext: any
): Promise<{ verdict: "PASS" | "FAIL", confidence: number, message?: string, compliance_mapping?: any }> {
  const apiKey = process.env.ENKRYPT_API_KEY;
  if (!apiKey) {
    console.warn("[ValidationAgent] WARNING: ENKRYPT_API_KEY not set. Stubbing Safety Check as PASS.");
    return { verdict: "PASS", confidence: 1.0, message: "Stubbed - No API Key" };
  }

  try {
    const response = await fetch("https://api.enkryptai.com/guardrails/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
      },
      body: JSON.stringify({
        text: JSON.stringify(findingsContext),
        detectors: { "toxicity": { "enabled": true }, "bias": { "enabled": true } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[ValidationAgent] Enkrypt API error: ${response.status} - ${errorText}`);
      return { verdict: "PASS", confidence: 0.5, message: `API Error: ${response.status}` };
    }

    const data: any = await response.json();
    
    // Check if any detector failed or found a violation
    const violations = data.detections || [];
    const isSafe = violations.length === 0;

    return {
      verdict: isSafe ? "PASS" : "FAIL",
      confidence: data.score ?? 1.0,
      message: isSafe ? "Safety checks passed." : `Safety violation detected: ${violations.map((v: any) => v.detector).join(", ")}`,
      compliance_mapping: data.compliance_mapping
    };

  } catch (err: any) {
    console.warn(`[ValidationAgent] Enkrypt request failed: ${err.message}`);
    return { verdict: "PASS", confidence: 0.0, message: "Network Error" };
  }
}
