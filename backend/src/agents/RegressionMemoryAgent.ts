import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { RepoScanMetadataSchema, RegressionResultSchema } from '../schema/events';
import { embedText, serializeFinding } from '../services/embedFindings';
import { searchFinding, upsertFinding, getPriorActiveFindings } from '../services/qdrantStore';
import { classifyFinding, Classification } from '../services/regressionDiff';

export const regressionMemoryAgent = new Agent({
  name: "RegressionMemoryAgent",
  id: "regressionMemoryAgent",
  instructions: "You are the RegressionMemoryAgent. You take findings, embed them, store in Qdrant, and compare against prior findings for regression tracking.",
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
  
  let regressionResults: z.infer<typeof RegressionResultSchema>[] = [];
  
  // 1. Process current findings
  for (const f of allFindings) {
    const serialized = serializeFinding(f);
    const embedding = await embedText(serialized);
    
    // Search for closest historical match
    const match = await searchFinding(repoMetadata.repositoryUrl, repoMetadata.commitSha, embedding);
    
    let classification: Classification = "NEW";
    let priorSha = undefined;
    let deltaMs = undefined;

    if (match) {
      classification = classifyFinding(match.score, match.payload.status);
      priorSha = match.payload.commitSha;
      deltaMs = Date.now() - match.payload.timestamp;
      console.log(`[RegressionMemoryAgent] Match score ${match.score.toFixed(3)} (status: ${match.payload.status}) -> ${classification}`);
    } else {
      console.log(`[RegressionMemoryAgent] No match found -> NEW`);
    }
    
    // Add to results
    regressionResults.push({
      classification,
      priorSha,
      timestampDeltaMs: deltaMs,
      finding: f
    });

    // Upsert as new vector representing this finding in the current commit
    await upsertFinding(
      repoMetadata.repositoryUrl,
      repoMetadata.commitSha,
      embedding,
      f,
      classification
    );
  }

  // 2. Identify and mark dropped/RESOLVED findings
  // Get all active findings from the immediate prior commit
  const priorActives = await getPriorActiveFindings(repoMetadata.repositoryUrl, repoMetadata.commitSha);
  
  for (const prior of priorActives) {
    // If this prior finding isn't highly similar to any of our current findings, it was fixed!
    // Since we already embedded all current findings, we can just do a similarity check here
    // But honestly, the easiest way is just to search Qdrant for this prior finding's embedding, 
    // EXCEPT we haven't flushed current findings to Qdrant? 
    // Actually, we JUST upserted them in the loop above! So we can search the CURRENT commit.
    
    // Check if the prior finding exists in the current commit
    // But wait, it's easier to just do a strict exact match signature check in memory
    // or just re-embed and search Qdrant for this specific commit.
    
    let foundInCurrent = false;
    for (const currentFinding of allFindings) {
      const currentSerialized = serializeFinding(currentFinding);
      const priorSerialized = serializeFinding(prior.payload.finding);
      if (currentSerialized === priorSerialized) {
         foundInCurrent = true;
         break;
      }
    }

    if (!foundInCurrent) {
      // It was resolved! Mark it as resolved in the current commit by upserting it
      console.log(`[RegressionMemoryAgent] Finding resolved in this commit. Marking RESOLVED.`);
      await upsertFinding(
        repoMetadata.repositoryUrl,
        repoMetadata.commitSha,
        prior.vector, // carry over the exact same vector
        prior.payload.finding,
        "RESOLVED"
      );
      
      regressionResults.push({
        classification: "RESOLVED",
        priorSha: prior.payload.commitSha,
        timestampDeltaMs: Date.now() - prior.payload.timestamp,
        finding: prior.payload.finding
      });
    }
  }

  return regressionResults;
}

