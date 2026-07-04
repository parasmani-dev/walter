import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { RepoScanMetadataSchema, SecretFindingSchema } from "../../schema/events";
import { scanFileForHighEntropy } from "./tools/entropyScan";
import { scanFileForPatterns } from "./tools/regexPatterns";

/**
 * Masks a secret string for safe logging.
 * Shows first 4 and last 4 characters, replaces middle with asterisks.
 */
function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 8) return "*".repeat(secret.length);
  return `${secret.substring(0, 4)}***${secret.substring(secret.length - 4)}`;
}

/**
 * Recursively find all files in a directory.
 */
function walkDir(dir: string, fileList: string[] = []) {
  if (fileList.length >= 5000) return fileList; // Hard cap
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (fileList.length >= 5000) break;
    // Exclude common large/unnecessary directories
    if (['.git', 'node_modules', 'dist', 'build', '.next', 'out'].includes(file)) continue;
    // Exclude lockfiles
    if (['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(file)) continue;
    
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walkDir(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

export const secretDetectorAgent = new Agent({
  name: "SecretDetectorAgent",
  id: "secretDetectorAgent",
  instructions: "You are the SecretDetectorAgent. You scan repository files for hardcoded secrets using both Shannon Entropy calculations and regex pattern matching.",
  model: {
    provider: "openai",
    name: "gpt-4o-mini",
    apiKey: "stub",
  } as any,
  tools: {},
});

/**
 * Runner function for the SecretDetectorAgent workflow.
 * Consumes the output from RepoScannerAgent.
 */
export async function runSecretDetector(repoMetadata: z.infer<typeof RepoScanMetadataSchema>) {
  console.log(`[SecretDetectorAgent] Starting scan on ${repoMetadata.clonePath}`);
  
  const findings: z.infer<typeof SecretFindingSchema>[] = [];
  
  // 1. Determine priority list. Scan HVTs first, then the rest.
  const allFiles = walkDir(repoMetadata.clonePath);
  if (allFiles.length >= 5000) {
    console.warn(`[SecretDetectorAgent] WARNING: Hard cap of 5000 files reached. Scanning may be incomplete.`);
  }
  const absoluteHvtPaths = repoMetadata.hvtFiles.map(p => path.join(repoMetadata.clonePath, p));
  
  // Sort so HVT files are scanned first.
  allFiles.sort((a, b) => {
    const aIsHvt = absoluteHvtPaths.includes(a);
    const bIsHvt = absoluteHvtPaths.includes(b);
    if (aIsHvt && !bIsHvt) return -1;
    if (!aIsHvt && bIsHvt) return 1;
    return 0;
  });

  // Threshold tunable parameters
  const ENTROPY_THRESHOLD = 4.5;

  for (const filePath of allFiles) {
    const ext = path.extname(filePath);
    // Only scan text files
    if (['.jpg', '.png', '.exe', '.wasm', '.pdf', '.zip'].includes(ext)) {
      continue;
    }
    
    const relativePath = path.relative(repoMetadata.clonePath, filePath);

    // Regex scan
    const patternMatches = scanFileForPatterns(filePath);
    for (const match of patternMatches) {
      findings.push({
        filePath: relativePath,
        lineNumber: match.line,
        patternType: match.type,
        confidence: match.confidence,
        maskedSecret: maskSecret(match.text)
      });
    }

    // Entropy scan
    const entropyMatches = scanFileForHighEntropy(filePath, ENTROPY_THRESHOLD);
    for (const match of entropyMatches) {
      // Deduplicate if already found via regex on the exact same text
      const alreadyFound = patternMatches.some(p => p.text === match.text);
      if (!alreadyFound) {
        findings.push({
          filePath: relativePath,
          lineNumber: match.line,
          patternType: "HIGH_ENTROPY",
          entropyScore: match.score,
          confidence: "MEDIUM",
          maskedSecret: maskSecret(match.text)
        });
      }
    }
  }

  console.log(`[SecretDetectorAgent] Scan complete. Found ${findings.length} potential secrets.`);
  return findings;
}
