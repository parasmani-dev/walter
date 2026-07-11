export function generateMarkdownReport(jsonReport: any, narrativeSummary: string) {
  const { scanMetadata, securityScore, letterGrade, findingsSummary, findings, validationVerdicts } = jsonReport;

  const md = [];
  md.push(`# Walter Security Scan Report`);
  md.push(`**Repository:** ${scanMetadata.repositoryUrl}`);
  md.push(`**Commit SHA:** \`${scanMetadata.commitSha}\``);
  md.push(`**Scan Time:** ${scanMetadata.timestamp}`);
  if (scanMetadata.capHit) {
    md.push(`> [!WARNING]\n> **File Limit Reached:** The scanner reached the 5,000 file limit. The scan may be incomplete.`);
  }
  md.push(`\n## Overall Security Posture`);
  md.push(`**Score:** ${securityScore} / 100`);
  md.push(`**Grade:** Grade ${letterGrade}\n`);
  
  md.push(`## AI Summary`);
  md.push(narrativeSummary);
  
  md.push(`\n## Findings Breakdown`);
  md.push(`- **Total Findings:** ${findingsSummary.totalFindings}`);
  md.push(`- **New Risks (Regressions):** ${findingsSummary.newRegressions}`);
  md.push(`- **Resolved Risks:** ${findingsSummary.resolvedRegressions}`);
  md.push(`- **Persistent Risks:** ${findingsSummary.persistentFindings}`);

  md.push(`\n## Details`);
  findings.forEach((f: any, idx: number) => {
    md.push(`### ${idx + 1}. [${f.classification}] ${f.finding.findingType || "SECRET"}`);
    md.push(`- **Severity/Confidence:** ${f.finding.severity || f.finding.confidence}`);
    if (f.finding.owaspCategory) md.push(`- **Category:** ${f.finding.owaspCategory}`);
    if (f.finding.filePath) md.push(`- **Location:** \`${f.finding.filePath}:${f.finding.lineNumber}\``);
    if (f.finding.sink) md.push(`- **Sink:** \`${f.finding.sink}\``);
    md.push("");
  });

  md.push(`\n## Validation Guardrails`);
  validationVerdicts.forEach((v: any) => {
    md.push(`- **${v.checkType}:** ${v.verdict} (${v.message})`);
  });

  return md.join("\n");
}

