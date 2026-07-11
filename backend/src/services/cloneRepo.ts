import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Checks if git is installed on the host.
 */
function checkGitInstalled() {
  try {
    execSync("git --version", { stdio: "ignore" });
  } catch (error) {
    throw new Error("FATAL: git binary is missing on the host. Native git is required for full commit history (FR-101).");
  }
}

/**
 * Clones a repository deeply into a temporary directory.
 * @param repoUrl URL of the repository to clone
 * @returns An object containing the temp directory path and a cleanup function
 */
export async function cloneRepo(repoUrl: string) {
  checkGitInstalled();

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "walter-repo-"));
  
  try {
    // Perform deep clone (we do not use --depth 1 because regression memory needs full history)
    execSync(`git clone ${repoUrl} ${tempDir}`, { stdio: "pipe" });
    
    // Get latest commit sha
    const commitSha = execSync(`git rev-parse HEAD`, { cwd: tempDir }).toString().trim();
    
    return {
      repoPath: tempDir,
      commitSha,
      cleanup: () => {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    };
  } catch (error: any) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

