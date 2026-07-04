import fs from "fs";

/**
 * Calculates the Shannon entropy of a string.
 * High entropy (> 4.5) often indicates a cryptographic secret or randomly generated string.
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  
  const charMap = new Map<string, number>();
  for (const char of str) {
    charMap.set(char, (charMap.get(char) || 0) + 1);
  }
  
  let entropy = 0;
  for (const count of charMap.values()) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

export interface EntropyMatch {
  line: number;
  score: number;
  text: string;
}

/**
 * Scans a file line by line and flags lines with high entropy tokens.
 * @param filePath Path to the file
 * @param threshold Entropy threshold (default: 4.5)
 * @returns Array of high-entropy matches
 */
export function scanFileForHighEntropy(filePath: string, threshold = 4.5): EntropyMatch[] {
  const matches: EntropyMatch[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Simple tokenizer: split by spaces, quotes, equals
    const tokens = line.split(/[\s"''=;]+/);
    
    for (const token of tokens) {
      // Filter out small tokens, they will have low entropy anyway but can skew results.
      // Also filter out obvious non-secrets (like common keywords).
      if (token.length > 16) {
        const score = calculateShannonEntropy(token);
        if (score > threshold) {
          // Avoid matching on things like long hashes inside standard filenames or very long standard URLs.
          // For this hackathon scope, any string > 16 chars with high entropy is flagged.
          matches.push({
            line: i + 1,
            score,
            text: token
          });
        }
      }
    }
  }

  return matches;
}
