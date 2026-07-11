import fs from "fs";

export const SECRET_PATTERNS = [
  {
    type: "AWS_KEY",
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    confidence: "HIGH"
  },
  {
    type: "PRIVATE_KEY",
    regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP|PRIVATE) KEY-----/g,
    confidence: "HIGH"
  },
  {
    type: "JWT",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    confidence: "MEDIUM"
  },
  {
    type: "GENERIC_API_KEY",
    regex: /(?:api[_-]?key|secret|token|password)[\s]*[:=][\s]*["']([^"']{16,})["']/gi,
    confidence: "MEDIUM"
  },
  {
    type: "DB_CONNECTION_STRING",
    regex: /(?:mongodb|postgres|mysql|redis):\/\/[a-zA-Z0-9_-]+:[^@]+@[a-zA-Z0-9.-]+/g,
    confidence: "HIGH"
  }
];

export interface PatternMatch {
  line: number;
  type: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  text: string;
  fullLine: string;
}

/**
 * Scans a file line by line against known regex secret signatures.
 */
export function scanFileForPatterns(filePath: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of SECRET_PATTERNS) {
      // Reset regex state if global
      pattern.regex.lastIndex = 0;
      
      let match;
      while ((match = pattern.regex.exec(line)) !== null) {
        // If it's a generic matcher, use the capture group text, else the full match
        const matchedText = match[1] || match[0];
        
        matches.push({
          line: i + 1,
          type: pattern.type,
          confidence: pattern.confidence as "LOW" | "MEDIUM" | "HIGH",
          text: matchedText,
          fullLine: line
        });
      }
    }
  }

  return matches;
}

