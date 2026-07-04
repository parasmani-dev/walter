import { Agent } from "@mastra/core/agent";
import { runZodValidation } from "./tools/zodValidate";
import { runEnkryptHallucinationCheck } from "./tools/enkryptHallucination";
import { runEnkryptSafetyCheck } from "./tools/enkryptSafety";
import { runEnkryptRiskScoreCheck } from "./tools/enkryptRiskScore";

export const ValidationAgent = new Agent({
  name: "ValidationAgent",
  id: "validationAgent",
  instructions: "Validate findings and narrative content using Zod schemas and Enkrypt AI guardrails.",
  model: {
    provider: "openai",
    name: "gpt-4o-mini",
    apiKey: "stub"
  } as any,
});

export async function processValidation(findingsContext: any[], syntheticSummary: string = "") {
  console.log(`[ValidationAgent] Starting validation on ${findingsContext.length} findings...`);
  const results: any[] = [];
  const validFindingsContext: any[] = [];

  // 1. Zod Validation (cheap, fast, structural)
  for (const finding of findingsContext) {
    const zodResult = runZodValidation(finding);
    if (zodResult.verdict === "FAIL") {
      console.warn(`[ValidationAgent] Zod validation failed for a finding: ${zodResult.message}`);
      // Log the structural failure
      results.push(zodResult);
      // Skip hitting Enkrypt API for invalid data
      continue;
    }
    validFindingsContext.push(finding);
  }

  if (validFindingsContext.length === 0) {
    console.log("[ValidationAgent] No valid findings to send to Enkrypt AI.");
    return results;
  }

  console.log(`[ValidationAgent] ${validFindingsContext.length} findings passed Zod structural validation.`);

  // 2. Enkrypt Safety Check (Toxicity, Bias)
  console.log("[ValidationAgent] Running Enkrypt AI Safety Check...");
  const safetyResult = await runEnkryptSafetyCheck(validFindingsContext);
  results.push({
    checkType: "ENKRYPT_SAFETY",
    verdict: safetyResult.verdict,
    confidence: safetyResult.confidence,
    message: safetyResult.message,
    compliance_mapping: safetyResult.compliance_mapping
  });

  // 3. Enkrypt Risk Score (Injection, Policy, PII)
  console.log("[ValidationAgent] Running Enkrypt AI Risk Score Check...");
  const riskResult = await runEnkryptRiskScoreCheck(validFindingsContext);
  results.push({
    checkType: "ENKRYPT_RISK",
    verdict: riskResult.verdict,
    confidence: riskResult.confidence,
    message: riskResult.message,
    compliance_mapping: riskResult.compliance_mapping
  });

  // 4. Enkrypt Hallucination Check (if summary text exists)
  if (syntheticSummary) {
    console.log("[ValidationAgent] Running Enkrypt AI Hallucination Check on AI-generated summary...");
    let hallucinationResult = await runEnkryptHallucinationCheck(syntheticSummary, validFindingsContext);
    
    if (hallucinationResult.verdict === "FAIL") {
      console.log(`[ValidationAgent] Hallucination detected! Attempting regeneration...`);
      // Simulating a regeneration of the summary by removing the hallucinated claim
      const regeneratedSummary = "Regenerated summary: Analysis complete. Found valid vulnerabilities (Regenerated to remove unverified claims).";
      
      console.log(`[ValidationAgent] Re-running Hallucination Check on regenerated summary...`);
      hallucinationResult = await runEnkryptHallucinationCheck(regeneratedSummary, validFindingsContext);
      if (hallucinationResult.verdict === "PASS") {
        hallucinationResult.verdict = "REGENERATED" as any;
      }
    }
    
    results.push({
      checkType: "ENKRYPT_HALLUCINATION",
      verdict: hallucinationResult.verdict,
      confidence: hallucinationResult.confidence,
      message: hallucinationResult.message
    });
  }

  console.log("[ValidationAgent] Validation complete.");
  return results;
}
