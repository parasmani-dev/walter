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
});

export const SecretFindingSchema = z.object({
  filePath: z.string(),
  lineNumber: z.number(),
  patternType: z.string(), // e.g. "AWS_KEY", "HIGH_ENTROPY", "JWT"
  entropyScore: z.number().optional(),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  maskedSecret: z.string(),
});

// The standard event message envelope across all agents
export const AgentEventMessageSchema = z.object({
  eventId: z.string().uuid(),
  timestamp: z.string().datetime(),
  agentSource: z.string(),
  payloadType: z.enum(["REPO_CLONED", "RECON_COMPLETE", "SECRET_DETECTED", "VULN_DETECTED"]),
  payload: z.any(), // Refined per event type if needed
});

