import { z } from "zod";

export const CloneRepoSchema = z.object({
  repositoryUrl: z.string().url(),
  commitSha: z.string().optional(),
});

export const RepoScanMetadataSchema = z.object({
  repositoryUrl: z.string().url(),
  clonePath: z.string(),
  commitSha: z.string(),
  hvtFiles: z.array(z.string()),
  capHit: z.boolean().default(false),
});

export const SecretFindingSchema = z.object({
  filePath: z.string(),
  lineNumber: z.number(),
  patternType: z.string(), // e.g. "AWS_KEY", "HIGH_ENTROPY", "JWT"
  entropyScore: z.number().optional(),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  maskedSecret: z.string(),
});

export const VulnFindingSchema = z.object({
  findingType: z.enum(["TAINT_FLOW", "DEPENDENCY_CVE"]),
  owaspCategory: z.string(), // e.g., "API3:2023 Broken Object Level Authorization"
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  // Taint Flow specific fields
  filePath: z.string().optional(),
  lineNumber: z.number().optional(),
  sink: z.string().optional(),
  source: z.string().optional(),
  snippetHash: z.string().optional(),
  enclosingFunction: z.string().optional(),
  // Dependency CVE specific fields
  packageName: z.string().optional(),
  packageVersion: z.string().optional(),
  cveId: z.string().optional(),
  description: z.string().optional()
});

export const RegressionResultSchema = z.object({
  classification: z.enum(["NEW", "RESOLVED", "PERSISTENT", "REGRESSION"]),
  priorSha: z.string().optional(),
  timestampDeltaMs: z.number().optional(),
  // The original finding (could be secret or vuln)
  finding: z.any() 
});

export const ValidationResultSchema = z.object({
  // ENKRYPT_HALLUCINATION is fulfilled via /guardrails/detect using the policy_violation detector
  // because /guardrails/hallucination is currently tier-gated (returning 503 coming soon). 
  // We use a custom policy_text to flag claims not grounded in the provided findingsContext.
  checkType: z.enum(["ZOD_STRUCTURAL", "ENKRYPT_HALLUCINATION", "ENKRYPT_SAFETY", "ENKRYPT_RISK"]),
  verdict: z.enum(["PASS", "FAIL", "REGENERATED"]),
  confidence: z.number().min(0).max(1).optional(),
  message: z.string().optional(),
  compliance_mapping: z.any().optional(), // OWASP LLM Top 10 2025 mappings from Enkrypt
  finding: z.any().optional()
});

// The standard event message envelope across all agents
export const AgentEventMessageSchema = z.object({
  eventId: z.string().uuid(),
  timestamp: z.string().datetime(),
  agentSource: z.string(),
  payloadType: z.enum(["REPO_CLONED", "RECON_COMPLETE", "SECRET_DETECTED", "VULN_DETECTED"]),
  payload: z.any(), // Refined per event type if needed
});

