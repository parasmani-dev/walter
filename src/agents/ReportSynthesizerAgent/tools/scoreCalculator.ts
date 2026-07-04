export function calculateScore(findings: any[]) {
  let score = 100;
  let penalty = 0;
  let bonus = 0;

  for (const item of findings) {
    if (!item.finding) continue;

    // Determine base penalty for severity (both VULN and SECRET)
    let severityPenalty = 0;
    const severity = item.finding.severity;
    
    // For TAINT_FLOW and DEPENDENCY_CVE, we use severity.
    // For SECRET_DETECTED, we use confidence (HIGH, MEDIUM, LOW) as proxy for severity if severity isn't defined
    const effectiveSeverity = severity || item.finding.confidence;

    switch (effectiveSeverity) {
      case "CRITICAL":
        severityPenalty = 20;
        break;
      case "HIGH":
        severityPenalty = 10;
        break;
      case "MEDIUM":
        severityPenalty = 5;
        break;
      case "LOW":
        severityPenalty = 1;
        break;
      default:
        severityPenalty = 1;
    }

    if (item.classification === "NEW") {
      penalty += severityPenalty * 1.5;
    } else if (item.classification === "PERSISTENT") {
      penalty += severityPenalty;
    } else if (item.classification === "RESOLVED") {
      bonus += severityPenalty; // Reward them for fixing issues
    }
  }

  score = score - penalty + bonus;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let grade = "F";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  return { numericScore: Math.round(score), letterGrade: grade };
}
