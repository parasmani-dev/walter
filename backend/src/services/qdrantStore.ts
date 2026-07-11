import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";

export const COLLECTION_NAME = "walter_findings";
const VECTOR_SIZE = 768; // Matching gemini-embedding-001 with outputDimensionality: 768

let _qdrant: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!_qdrant) {
    const url = process.env.QDRANT_URL;
    const apiKey = process.env.QDRANT_API_KEY;
    if (!url || !apiKey) {
      throw new Error("QDRANT_URL and QDRANT_API_KEY must be defined in the environment.");
    }
    _qdrant = new QdrantClient({
      url,
      apiKey,
    });
  }
  return _qdrant;
}

export async function ensureCollection() {
  const client = getQdrantClient();
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });
      console.log(`[Qdrant] Created collection ${COLLECTION_NAME}`);
      
      // Create keyword indices for filtering
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "repoUrl",
        field_schema: "keyword",
        wait: true
      });
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "commitSha",
        field_schema: "keyword",
        wait: true
      });
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "status",
        field_schema: "keyword",
        wait: true
      });
      console.log(`[Qdrant] Created payload indices`);
    }
  } catch (e) {
    console.error(`[Qdrant] Error checking/creating collection:`, e);
    throw e;
  }
}

export interface FindingPayload {
  repoUrl: string;
  commitSha: string;
  timestamp: number;
  status: "NEW" | "PERSISTENT" | "REGRESSION" | "RESOLVED";
  finding: any; 
}

export async function upsertFinding(
  repoUrl: string,
  commitSha: string,
  embedding: number[],
  finding: any,
  status: "NEW" | "PERSISTENT" | "REGRESSION" | "RESOLVED"
) {
  await ensureCollection();
  const client = getQdrantClient();

  const uuid = crypto.randomUUID();

  const payload: FindingPayload = {
    repoUrl,
    commitSha,
    timestamp: Date.now(),
    status,
    finding
  };

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: uuid,
        vector: embedding,
        payload: payload as any
      }
    ]
  });
  
  console.log(`[Qdrant] Upserted finding (${status}) for ${repoUrl} @ ${commitSha}`);
}

/**
 * Find the most similar historical finding vector for a given repo, excluding current commit.
 * Returns the highest scoring matches above the threshold (handled by caller), tie-broken by most recent timestamp.
 */
export async function searchFinding(
  repoUrl: string,
  currentCommitSha: string,
  embedding: number[]
): Promise<{ score: number, payload: FindingPayload } | null> {
  await ensureCollection();
  const client = getQdrantClient();

  const result = await client.search(COLLECTION_NAME, {
    vector: embedding,
    filter: {
      must: [
        {
          key: "repoUrl",
          match: {
            value: repoUrl
          }
        }
      ],
      must_not: [
        {
          key: "commitSha",
          match: {
            value: currentCommitSha
          }
        }
      ]
    },
    limit: 10, // Fetch top 10 to apply tie-break logic
    with_payload: true
  });

  if (result.length === 0) return null;

  // Map results to extract score and payload
  const matches = result.map(p => ({
    score: p.score,
    payload: p.payload as unknown as FindingPayload
  }));

  // Find the highest score
  const highestScore = Math.max(...matches.map(m => m.score));

  // If there are multiple matches with exactly the same top score, or very close scores, we want to tie-break by most recent timestamp.
  // The user requested: "When search() returns multiple vectors above 0.85 threshold, select match by most recent commitSha/timestamp, not just highest similarity score. Add explicit tie-break logic for this."
  
  // So we filter all matches that are above 0.85
  const thresholdMatches = matches.filter(m => m.score >= 0.85);

  if (thresholdMatches.length === 0) {
    // If none above threshold, return the absolute highest anyway so the caller can log it and fail the threshold check
    // Sort highest score first, then by timestamp descending
    matches.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.0001) return b.score - a.score;
      return b.payload.timestamp - a.payload.timestamp;
    });
    return matches[0];
  }

  // Tie-break logic: Sort threshold matches by timestamp descending (most recent first)
  thresholdMatches.sort((a, b) => b.payload.timestamp - a.payload.timestamp);
  
  return thresholdMatches[0];
}

/**
 * Get all findings from the immediate prior commit.
 * We need this to detect which findings were dropped (RESOLVED) in the current commit.
 */
export async function getPriorActiveFindings(
  repoUrl: string,
  currentCommitSha: string
): Promise<{ id: string, vector: number[], payload: FindingPayload }[]> {
  await ensureCollection();
  const client = getQdrantClient();

  // First, find the most recent commitSha that isn't the current one
  // We can query 1 result just to get the timestamp of the latest finding
  const latestResult = await client.scroll(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: "repoUrl",
          match: {
            value: repoUrl
          }
        }
      ],
      must_not: [
        {
          key: "commitSha",
          match: {
            value: currentCommitSha
          }
        }
      ]
    },
    limit: 1000,
    with_payload: true,
    with_vector: true
  });

  const points = latestResult.points.map(p => ({
    id: String(p.id),
    vector: p.vector as number[],
    payload: p.payload as unknown as FindingPayload
  }));

  if (points.length === 0) return [];

  // Sort all historical points by timestamp descending
  points.sort((a, b) => b.payload.timestamp - a.payload.timestamp);

  // The most recent commitSha is the one from the newest point
  const priorCommitSha = points[0].payload.commitSha;

  // Filter points to only include those from the prior commit AND that are active (not RESOLVED)
  return points.filter(p => p.payload.commitSha === priorCommitSha && p.payload.status !== "RESOLVED");
}

