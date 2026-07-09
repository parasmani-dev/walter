import fs from "fs";
import path from "path";
import semver from "semver";

export interface GhsaMatch {
  packageName: string;
  packageVersion: string;
  cveId: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  owaspCategory: string;
}

export async function checkDependenciesWithGHSA(repoPath: string): Promise<GhsaMatch[]> {
  const matches: GhsaMatch[] = [];
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'stub') {
    console.warn("[VulnAnalyzerAgent] GITHUB_TOKEN not found or stubbed. Skipping GHSA check.");
    return matches;
  }

  // 1. Read package.json
  const pkgPath = path.join(repoPath, "package.json");
  if (!fs.existsSync(pkgPath)) return matches;
  
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch (e) {
    return matches;
  }

  const dependencies = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {})
  };

  // For testing/hackathon purposes, we will only query a few dependencies if the list is huge,
  // or query all of them if small. We will just iterate.
  for (const [pkgName, versionRange] of Object.entries(dependencies)) {
    // Extract actual version string (strip ^, ~, >=)
    let version = (versionRange as string).replace(/^[^\d]+/, '');
    
    // We construct a query to search GHSA. 
    // The GitHub GraphQL API requires checking by ecosystem. NPM in our case.
    const query = `
      query($package: String!) {
        securityVulnerabilities(ecosystem: NPM, package: $package, first: 10) {
          nodes {
            severity
            vulnerableVersionRange
            advisory {
              ghsaId
              summary
            }
          }
        }
      }
    `;

    try {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Authorization": `bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "Walter-VulnAnalyzerAgent"
        },
        body: JSON.stringify({ query, variables: { package: pkgName } })
      });

      const json = await response.json();
      if (json.errors) {
        console.error(`GHSA Query Error for ${pkgName}:`, json.errors);
        continue;
      }

      const vulnerabilities = json.data?.securityVulnerabilities?.nodes || [];
      const seenAdvisories = new Set<string>();
      
      for (const vuln of vulnerabilities) {
        // Evaluate if our version is vulnerable
        const range = vuln.vulnerableVersionRange; // e.g. ">= 1.2.0, < 1.3.5" or "= 2.0.0"
        const ghsaId = vuln.advisory.ghsaId;
        
        if (seenAdvisories.has(ghsaId)) continue;
        
        try {
          // If the semver package says our version satisfies the vulnerable range, it's a hit!
          if (semver.satisfies(version, range)) {
            seenAdvisories.add(ghsaId);
            matches.push({
              packageName: pkgName,
              packageVersion: version,
              cveId: ghsaId,
              description: vuln.advisory.summary,
              severity: vuln.severity.toUpperCase() as any,
              owaspCategory: "API9:2023 Improper Inventory Management" // Vulnerable dependencies map nicely here
            });
          }
        } catch (e) {
          // semver mismatch format
        }
      }
      
    } catch (e) {
      console.error(`Error querying GHSA for ${pkgName}:`, e);
    }
  }

  return matches;
}
