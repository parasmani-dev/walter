import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { RepoScanMetadataSchema, RegressionResultSchema } from "../../schema/events";
import { embedText, serializeFinding } from "./tools/embedFindings";
import { upsertSnapshot, getPriorSnapshot } from "./tools/qdrantStore";
import { computeRegressionDiff } from "./tools/regressionDiff";

export const regressionMemoryAgent = new Agent({
  name: "RegressionMemoryAgent",
  id: "regressionMemoryAgent",
  instructions: "You are the RegressionMemoryAgent. You take combined findings, embed them, store in Qdrant keyed by commit SHA, and compare against prior snapshots of the same repo.",
  model: {
    provider: "openai",
    name: "gpt-4o-mini",
    apiKey: "stub",
  } as any,
  tools: {},
});

export async function runRegressionMemory(
  repoMetadata: z.infer<typeof RepoScanMetadataSchema>,
  allFindings: any[]
): Promise<z.infer<typeof RegressionResultSchema>[]> {
  console.log(`[RegressionMemoryAgent] Processing ${allFindings.length} findings for ${repoMetadata.repositoryUrl} @ ${repoMetadata.commitSha}`);
  
  // 1. Embed current findings
  const serialized = allFindings.map(serializeFinding).join("\n");
  const embedding = await embedText(serialized);
  
  let regressionResults: z.infer<typeof RegressionResultSchema>[] = [];
  
  // 2. Fetch prior snapshot
  console.log(`[RegressionMemoryAgent] Querying Qdrant for prior snapshots of ${repoMetadata.repositoryUrl}...`);
  const priorSnapshot = await getPriorSnapshot(repoMetadata.repositoryUrl, repoMetadata.commitSha);
  
  if (priorSnapshot) {
    const deltaMs = Date.now() - priorSnapshot.timestamp;
    console.log(`[RegressionMemoryAgent] Found prior snapshot @ ${priorSnapshot.commitSha}. Computing diff...`);
    
    // 3. Diff findings
    regressionResults = computeRegressionDiff(allFindings, priorSnapshot.findings, priorSnapshot.commitSha, deltaMs);
  } else {
    console.log(`[RegressionMemoryAgent] No prior snapshot found. All findings are classified as NEW.`);
    for (const f of allFindings) {
      regressionResults.push({
        classification: "NEW",
        finding: f
      });
    }
  }

  // 4. Upsert current snapshot to Qdrant
  console.log(`[RegressionMemoryAgent] Storing snapshot for ${repoMetadata.commitSha} in Qdrant...`);
  await upsertSnapshot(repoMetadata.repositoryUrl, repoMetadata.commitSha, embedding, allFindings);
  
  return regressionResults;
}
