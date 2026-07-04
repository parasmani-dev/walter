import { z } from "zod";
import { RegressionResultSchema } from "../../../schema/events";

function generateFindingSignature(finding: any): string {
  if (finding.findingType === "TAINT_FLOW" || finding.findingType === "DEPENDENCY_CVE") {
    // VulnAnalyzer finding
    if (finding.findingType === "TAINT_FLOW") {
      // Content identity fingerprint: strip line number reliance!
      const scope = finding.enclosingFunction || "global";
      const hash = finding.snippetHash || "";
      return `TAINT|${finding.filePath}|${scope}|${finding.sink}|${finding.source}|${hash}`;
    }
    if (finding.findingType === "DEPENDENCY_CVE") {
      return `CVE|${finding.packageName}|${finding.packageVersion}|${finding.cveId}`;
    }
  } else if (finding.maskedSecret) {
    // SecretDetector finding
    return `SECRET|${finding.filePath}|${finding.lineNumber}|${finding.patternType}|${finding.maskedSecret}`;
  }
  
  // Fallback
  return JSON.stringify(finding);
}

export function computeRegressionDiff(
  currentFindings: any[],
  priorFindings: any[],
  priorSha: string,
  timestampDeltaMs: number
): z.infer<typeof RegressionResultSchema>[] {
  const results: z.infer<typeof RegressionResultSchema>[] = [];
  
  const currentSigs = new Map<string, any>();
  for (const f of currentFindings) {
    currentSigs.set(generateFindingSignature(f), f);
  }

  const priorSigs = new Map<string, any>();
  for (const f of priorFindings) {
    priorSigs.set(generateFindingSignature(f), f);
  }

  // Find NEW and PERSISTENT
  for (const [sig, finding] of currentSigs.entries()) {
    if (priorSigs.has(sig)) {
      results.push({
        classification: "PERSISTENT",
        priorSha,
        timestampDeltaMs,
        finding
      });
    } else {
      results.push({
        classification: "NEW",
        priorSha,
        timestampDeltaMs,
        finding
      });
    }
  }

  // Find RESOLVED
  for (const [sig, finding] of priorSigs.entries()) {
    if (!currentSigs.has(sig)) {
      results.push({
        classification: "RESOLVED",
        priorSha,
        timestampDeltaMs,
        finding
      });
    }
  }

  return results;
}
