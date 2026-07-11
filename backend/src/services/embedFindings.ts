import { GoogleGenerativeAI } from "@google/generative-ai";

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  try {
    const request: any = {
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: 768
    };
    const result = await model.embedContent(request);
    return result.embedding.values;
  } catch (err: any) {
    if (err.message?.includes("suspended") || err.message?.includes("quota")) {
      console.warn("[RegressionMemoryAgent] WARNING: Gemini API Key suspended or quota hit! Falling back to stub vector to verify Qdrant round-trip.");
      return new Array(768).fill(0.1);
    }
    throw err;
  }
}

export function serializeFinding(finding: any): string {
  // A deterministic way to serialize a finding for embedding and comparison
  return JSON.stringify(finding, Object.keys(finding).sort());
}

