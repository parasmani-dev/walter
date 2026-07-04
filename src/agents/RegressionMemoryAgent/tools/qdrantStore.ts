import { QdrantClient } from "@qdrant/js-client-rest";
import crypto from "crypto";

export const COLLECTION_NAME = "walter_snapshots_v3";
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
      
      // Create a keyword index for repoUrl filtering
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "repoUrl",
        field_schema: "keyword",
        wait: true
      });
      console.log(`[Qdrant] Created payload index for repoUrl`);

      // Create a keyword index for commitSha filtering
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "commitSha",
        field_schema: "keyword",
        wait: true
      });
      console.log(`[Qdrant] Created payload index for commitSha`);
    }
  } catch (e) {
    console.error(`[Qdrant] Error checking/creating collection:`, e);
    throw e;
  }
}

export interface SnapshotPayload {
  repoUrl: string;
  commitSha: string;
  timestamp: number;
  findings: any[]; // Full structured findings
}

export async function upsertSnapshot(
  repoUrl: string,
  commitSha: string,
  embedding: number[],
  findings: any[]
) {
  await ensureCollection();
  const client = getQdrantClient();

  // Generate a deterministic UUID based on repoUrl and commitSha
  const idHash = crypto.createHash('md5').update(`${repoUrl}:${commitSha}`).digest('hex');
  const uuid = [
    idHash.slice(0, 8),
    idHash.slice(8, 12),
    idHash.slice(12, 16),
    idHash.slice(16, 20),
    idHash.slice(20, 32)
  ].join('-');

  const payload: SnapshotPayload = {
    repoUrl,
    commitSha,
    timestamp: Date.now(),
    findings
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
  
  console.log(`[Qdrant] Upserted snapshot for ${repoUrl} @ ${commitSha}`);
}

/**
 * Find the most recent prior snapshot for a given repo URL, excluding the current commit.
 */
export async function getPriorSnapshot(repoUrl: string, currentCommitSha: string): Promise<SnapshotPayload | null> {
  await ensureCollection();
  const client = getQdrantClient();

  // Query by filter, not by vector similarity, to get all snapshots for this repo
  const result = await client.scroll(COLLECTION_NAME, {
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
    limit: 100, // Assuming we won't have more than 100 snapshots for a hackathon demo
    with_payload: true
  });

  const snapshots = result.points.map(p => p.payload as unknown as SnapshotPayload);
  
  if (snapshots.length === 0) {
    return null;
  }

  // Sort by timestamp descending
  snapshots.sort((a, b) => b.timestamp - a.timestamp);
  return snapshots[0];
}
