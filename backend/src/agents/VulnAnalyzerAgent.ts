import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { RepoScanMetadataSchema, VulnFindingSchema } from '../schema/events';
import { analyzeTaintFlow } from '../services/taintFlow';
import { checkDependenciesWithGHSA } from '../services/ghsaLookup';

export const vulnAnalyzerAgent = new Agent({
  name: "VulnAnalyzerAgent",
  id: "vulnAnalyzerAgent",
  instructions: "You are the VulnAnalyzerAgent. You consume AST output to trace tainted data flow (intraprocedural) and cross-reference known vulnerable dependencies against GitHub Security Advisory (GHSA).",
  model: {
    provider: "openai",
    name: "gpt-4o-mini",
    apiKey: "stub",
  } as any,
  tools: {},
});

/**
 * Runner function for the VulnAnalyzerAgent workflow.
 * Consumes the output from RepoScannerAgent.
 */
export async function runVulnAnalyzer(repoMetadata: z.infer<typeof RepoScanMetadataSchema>) {
  console.log(`[VulnAnalyzerAgent] Starting vulnerability scan on ${repoMetadata.clonePath}`);
  
  const findings: z.infer<typeof VulnFindingSchema>[] = [];
  
  // 1. GHSA Dependency Check
  console.log(`[VulnAnalyzerAgent] Querying GHSA for dependency vulnerabilities...`);
  const ghsaMatches = await checkDependenciesWithGHSA(repoMetadata.clonePath);
  for (const match of ghsaMatches) {
    findings.push({
      findingType: "DEPENDENCY_CVE",
      owaspCategory: match.owaspCategory,
      severity: match.severity,
      packageName: match.packageName,
      packageVersion: match.packageVersion,
      cveId: match.cveId,
      description: match.description,
      richSolution: match.richSolution
    });
  }

  // 2. Intraprocedural Taint Flow Analysis
  // For taint flow, we'll scan the HVT files first, then all files.
  console.log(`[VulnAnalyzerAgent] Analyzing AST for intraprocedural taint flows...`);
  
  function walkDir(dir: string, fileList: string[] = []) {
    if (fileList.length >= 5000) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (fileList.length >= 5000) break;
      if (['.git', 'node_modules', 'dist', 'build', '.next', 'out'].includes(file)) continue;
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

  const allFiles = walkDir(repoMetadata.clonePath);
  if (allFiles.length >= 5000) {
    console.warn(`[VulnAnalyzerAgent] WARNING: Hard cap of 5000 files reached. Scanning may be incomplete.`);
  }

  const absoluteHvtPaths = repoMetadata.hvtFiles.map(p => path.join(repoMetadata.clonePath, p));
  allFiles.sort((a, b) => {
    const aIsHvt = absoluteHvtPaths.includes(a);
    const bIsHvt = absoluteHvtPaths.includes(b);
    if (aIsHvt && !bIsHvt) return -1;
    if (!aIsHvt && bIsHvt) return 1;
    return 0;
  });

  for (const filePath of allFiles) {
    const relativePath = path.relative(repoMetadata.clonePath, filePath);
    const taintMatches = await analyzeTaintFlow(filePath);
    
    for (const match of taintMatches) {
      findings.push({
        findingType: "TAINT_FLOW",
        owaspCategory: match.owaspCategory,
        severity: match.severity,
        filePath: relativePath,
        lineNumber: match.line,
        sink: match.sink,
        source: match.source,
        snippetHash: match.snippetHash,
        enclosingFunction: match.enclosingFunction
      });
    }
  }

  console.log(`[VulnAnalyzerAgent] Scan complete. Found ${findings.length} vulnerabilities.`);
  return findings;
}

