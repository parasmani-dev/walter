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
  fullLine: string;
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

  // Regex to match string literals (single, double, or backtick quotes)
  const literalRegex = /(["'`])((?:(?=(\\?))\3.)*?)\1/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let match;
    while ((match = literalRegex.exec(line)) !== null) {
      const token = match[2]; // Extracted content without quotes
      
      // Filter out small tokens, they will have low entropy anyway but can skew results.
      if (token.length > 16) {
        const score = calculateShannonEntropy(token);
        if (score > threshold) {
          // For this hackathon scope, any string > 16 chars with high entropy is flagged.
          matches.push({
            line: i + 1,
            score,
            text: token,
            fullLine: line
          });
        }
      }
    }
  }

  return matches;
}
