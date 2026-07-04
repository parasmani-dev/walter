import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { cloneRepo } from "./tools/cloneRepo";
import { analyzeAST } from "./tools/analyzeAST";
import { RepoScanMetadataSchema } from "../../schema/events";

// Tool Definitions for the Mastra Agent
const cloneRepoTool = {
  id: "cloneRepo",
  description: "Deep clone a GitHub repository for reconnaissance and return the temp path.",
  inputSchema: z.object({ repositoryUrl: z.string().url() }),
  outputSchema: z.object({ repoPath: z.string(), commitSha: z.string() }),
  execute: async ({ context }: any) => {
    // Note: cleanup needs to happen *after* the full scan, so we might return the cleanup fn in a real workflow.
    // For this agent structure, we just clone.
    const { repoPath, commitSha, cleanup } = await cloneRepo(context.repositoryUrl);
    // In a full pipeline, we would register `cleanup` to a global task registry or similar.
    // For FR-100, we'll run cleanup in the agent orchestrator after all tools finish if it were a linear script,
    // but here we just return the path so analyzeAST can use it.
    // To meet AC for this demo, we'll store the cleanup function in a global registry (hack for now).
    (global as any).__walterCleanup = cleanup;
    return { repoPath, commitSha };
  }
};

const analyzeASTTool = {
  id: "analyzeAST",
  description: "Parse the AST of a local repository and identify High Value Targets (HVTs).",
  inputSchema: z.object({ repoPath: z.string() }),
  outputSchema: z.object({ hvtFiles: z.array(z.string()) }),
  execute: async ({ context }: any) => {
    const hvtFiles = await analyzeAST(context.repoPath);
    return { hvtFiles };
  }
};

export const repoScannerAgent = new Agent({
  name: "RepoScannerAgent",
  id: "repoScannerAgent",
  instructions: "You are the RepoScannerAgent. Your job is to clone a given GitHub repository, parse its AST, identify High Value Targets (HVTs) like auth controllers, and output the metadata.",
  model: {
    provider: "openai",
    name: "gpt-4o-mini",
    apiKey: "stub",
  } as any,
  tools: {
    cloneRepo: cloneRepoTool,
    analyzeAST: analyzeASTTool,
  },
});

/**
 * Runner function for the agent.
 * This function triggers the tools sequentially to demonstrate the FR-100 capabilities.
 */
export async function runRepoScanner(repositoryUrl: string) {
  console.log(`[RepoScannerAgent] Starting scan for ${repositoryUrl}...`);
  
  // 1. Clone
  console.log(`[RepoScannerAgent] Cloning...`);
  const { repoPath, commitSha, cleanup } = await cloneRepo(repositoryUrl);
  console.log(`[RepoScannerAgent] Cloned to ${repoPath} (SHA: ${commitSha})`);

  try {
    // 2. Analyze AST
    console.log(`[RepoScannerAgent] Analyzing AST for High Value Targets...`);
    const hvtFiles = await analyzeAST(repoPath);
    console.log(`[RepoScannerAgent] Found ${hvtFiles.length} HVTs:`, hvtFiles);

    // 3. Construct the event payload
    const metadata = {
      repositoryUrl,
      clonePath: repoPath,
      commitSha,
      hvtFiles
    };

    // Validate against our Zod schema
    RepoScanMetadataSchema.parse(metadata);

    return { metadata, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
