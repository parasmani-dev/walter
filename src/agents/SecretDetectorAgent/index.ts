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
    if (['.git', 'node_modules', 'dist', 'build', '.next', 'out', 'vendor'].includes(file)) continue;
    // Exclude lockfiles and minified files
    if (['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock'].includes(file)) continue;
    if (file.endsWith('.min.js')) continue;
    
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

function checkContextSignal(line: string): boolean | null {
  // Note: This only checks the matched line, not surrounding lines - known limitation, not a blocker for now.
  const lower = line.toLowerCase();
  // Veto URLs, style classes, and DNS domains
  if (/class|style|path|svg|css|classname|http|https|dns|\.com/i.test(lower)) return false;
  if (/key|secret|token|password|auth|credential/i.test(lower)) return true;
  return null;
}

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
    // Entropy scan
    const entropyMatches = scanFileForHighEntropy(filePath, ENTROPY_THRESHOLD);

    // Combine unique text targets to evaluate
    const allTargets = new Map<string, {
      line: number;
      text: string;
      fullLine: string;
      patternTypes: string[];
      entropyScore?: number;
      confidence: "LOW" | "MEDIUM" | "HIGH";
    }>();

    for (const match of patternMatches) {
      if (!allTargets.has(match.text)) {
        allTargets.set(match.text, {
          line: match.line,
          text: match.text,
          fullLine: match.fullLine,
          patternTypes: [match.type],
          confidence: match.confidence
        });
      } else {
        allTargets.get(match.text)!.patternTypes.push(match.type);
      }
    }

    for (const match of entropyMatches) {
      if (!allTargets.has(match.text)) {
        allTargets.set(match.text, {
          line: match.line,
          text: match.text,
          fullLine: match.fullLine,
          patternTypes: ["HIGH_ENTROPY"],
          entropyScore: match.score,
          confidence: "MEDIUM"
        });
      } else {
        const target = allTargets.get(match.text)!;
        target.entropyScore = match.score;
        // If it was only a regex hit before, ensure HIGH_ENTROPY is in the types just in case
        if (!target.patternTypes.includes("HIGH_ENTROPY")) {
           target.patternTypes.push("HIGH_ENTROPY");
        }
      }
    }

    for (const target of allTargets.values()) {
      let signals = 0;
      
      const entropyHit = target.entropyScore !== undefined && target.entropyScore > ENTROPY_THRESHOLD;
      const regexHit = target.patternTypes.some(t => t !== "HIGH_ENTROPY");
      
      const contextCheck = checkContextSignal(target.fullLine);
      const contextHit = contextCheck === true; // Veto just suppresses the context signal, it doesn't subtract from signals.
      
      if (entropyHit) signals++;
      if (regexHit) signals++;
      if (contextHit) signals++;
      
      if (signals >= 2) {
        console.log(`\n[DEBUG Secret] Found secret in ${relativePath}:${target.line}`);
        console.log(`  Text: ${target.text}`);
        console.log(`  EntropyHit: ${entropyHit} (Score: ${target.entropyScore})`);
        console.log(`  RegexHit: ${regexHit} (Types: ${target.patternTypes.join(',')})`);
        console.log(`  ContextHit: ${contextHit} (Line context check: ${contextCheck})`);
        
        findings.push({
          filePath: relativePath,
          lineNumber: target.line,
          // Prefer regex pattern type over generic HIGH_ENTROPY
          patternType: target.patternTypes.find(t => t !== "HIGH_ENTROPY") || "HIGH_ENTROPY",
          entropyScore: target.entropyScore,
          confidence: target.confidence,
          maskedSecret: maskSecret(target.text)
        });
      }
    }
  }

  console.log(`[SecretDetectorAgent] Scan complete. Found ${findings.length} potential secrets.`);
  return findings;
}
