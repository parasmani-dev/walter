import { v4 as uuidv4 } from "uuid";
import { runRepoScanner } from "../agents/RepoScannerAgent";
import { runSecretDetector } from "../agents/SecretDetectorAgent";
import { runVulnAnalyzer } from "../agents/VulnAnalyzerAgent";
import { runRegressionMemory } from "../agents/RegressionMemoryAgent";
import { runReportSynthesizer } from "../agents/ReportSynthesizerAgent";

export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  repositoryUrl: string;
  status: JobStatus;
  progress?: string;
  error?: string;
  errorType?: "INVALID_URL" | "PRIVATE_REPO" | "OVERSIZED_REPO" | "GENERIC_ERROR";
  result?: {
    jsonReport: any;
    markdownReport: string;
  };
}

const jobs: Record<string, Job> = {};

export function enqueueJob(repositoryUrl: string): string {
  const id = uuidv4();
  jobs[id] = {
    id,
    repositoryUrl,
    status: "PENDING",
  };

  // Kick off processing asynchronously
  processJob(id).catch(err => console.error(`Job ${id} failed in background:`, err));

  return id;
}

export function getJobStatus(id: string): Job | undefined {
  return jobs[id];
}

async function processJob(id: string) {
  const job = jobs[id];
  job.status = "RUNNING";
  job.progress = "Starting clone";

  let cleanupFn: (() => void) | undefined;

  try {
    // 1. Scanner (Clone + AST)
    job.progress = "Cloning and scanning repository";
    let scanResult;
    try {
      scanResult = await runRepoScanner(job.repositoryUrl);
    } catch (e: any) {
      if (e.message?.includes("Repository not found") || e.message?.includes("Authentication failed") || e.message?.includes("could not read Username")) {
         throw new Error("PRIVATE_REPO: Repository is private or inaccessible");
      }
      if (e.message?.includes("Invalid repository") || e.message?.includes("not found")) {
         throw new Error("INVALID_URL: The repository URL is invalid or does not exist");
      }
      throw e;
    }
    
    const { metadata: repoMetadata, cleanup } = scanResult;
    cleanupFn = cleanup;

    // Check for Oversized Repo Cap Hit
    if (repoMetadata.capHit) {
      throw new Error("OVERSIZED_REPO: Repository exceeds the 5,000 file scanning limit.");
    }

    // 2. Secret Detector
    job.progress = "Detecting secrets";
    const secrets = await runSecretDetector(repoMetadata);

    // 3. Vuln Analyzer
    job.progress = "Analyzing vulnerabilities";
    const vulns = await runVulnAnalyzer(repoMetadata);

    const allFindings = [...secrets, ...vulns];

    // 4. Regression Memory
    job.progress = "Comparing against prior regressions";
    const regressions = await runRegressionMemory(repoMetadata, allFindings);

    // 5. Report Synthesizer (which calls Validation internally)
    job.progress = "Synthesizing and validating report";
    const finalReport = await runReportSynthesizer(repoMetadata, regressions);

    job.result = finalReport;
    job.status = "COMPLETED";
    job.progress = "Done";

  } catch (error: any) {
    job.status = "FAILED";
    job.error = error.message || "An unknown error occurred";
    
    if (error.message.startsWith("PRIVATE_REPO:")) {
      job.errorType = "PRIVATE_REPO";
      job.error = "Repository is private or inaccessible.";
    } else if (error.message.startsWith("INVALID_URL:")) {
      job.errorType = "INVALID_URL";
      job.error = "The repository URL is invalid.";
    } else if (error.message.startsWith("OVERSIZED_REPO:")) {
      job.errorType = "OVERSIZED_REPO";
      job.error = "Repository exceeds the 5,000 file scanning limit.";
    } else {
      job.errorType = "GENERIC_ERROR";
    }
  } finally {
    if (cleanupFn) {
      cleanupFn();
    }
  }
}
