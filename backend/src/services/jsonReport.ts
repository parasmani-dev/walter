export function generateJsonReport(
  repoMetadata: any,
  findings: any[],
  score: { numericScore: number; letterGrade: string },
  validationResults: any[]
) {
  return {
    scanMetadata: {
      repositoryUrl: repoMetadata.repositoryUrl,
      commitSha: repoMetadata.commitSha,
      hvtCount: repoMetadata.hvtFiles.length,
      capHit: repoMetadata.capHit,
      timestamp: new Date().toISOString()
    },
    securityScore: score.numericScore,
    letterGrade: score.letterGrade,
    findingsSummary: {
      totalFindings: findings.length,
      newRegressions: findings.filter((f) => f.classification === "NEW").length,
      resolvedRegressions: findings.filter((f) => f.classification === "RESOLVED").length,
      persistentFindings: findings.filter((f) => f.classification === "PERSISTENT").length,
    },
    findings: findings,
    validationVerdicts: validationResults
  };
}

