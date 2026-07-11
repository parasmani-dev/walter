git add src/agents/SecretDetectorAgent/index.ts
git commit -m "fix(secret-detector): enforce 2-of-3 signal quorum for findings"

git add src/agents/SecretDetectorAgent/tools/entropyScan.ts
git commit -m "fix(secret-detector): constrain entropy scanning to string literals"

git add src/agents/SecretDetectorAgent/tools/regexPatterns.ts
git commit -m "fix(secret-detector): add context vetoes for DNS and URLs"

git add src/agents/ReportSynthesizerAgent/tools/scoreCalculator.ts
git commit -m "fix(scoring): replace linear penalty with asymptotic formula"

git add src/agents/VulnAnalyzerAgent/tools/ghsaLookup.ts
git commit -m "fix(vuln-analyzer): deduplicate GHSA dependency CVEs"

git add src/agents/VulnAnalyzerAgent/tools/taintFlow.ts
git commit -m "feat(vuln-analyzer): implement single-hop variable tracking for taint flows"

git add src/agents/RegressionMemoryAgent/tools/qdrantStore.ts
git commit -m "feat(regression-memory): implement timestamp tie-breaking and cloud Qdrant support"

git add src/agents/RegressionMemoryAgent/tools/regressionDiff.ts src/agents/RegressionMemoryAgent/index.ts
git commit -m "fix(regression-memory): enforce 0.85 similarity threshold logic"

git add src/agents/ValidationAgent/tools/enkryptHallucination.ts src/agents/ValidationAgent/tools/enkryptRiskScore.ts src/agents/ValidationAgent/tools/enkryptSafety.ts
git commit -m "chore(validation): update enkrypt integration handling"

git add test-run.ts src/schema/events.ts package.json package-lock.json
git commit -m "test: update test runners and fixtures"

git push
