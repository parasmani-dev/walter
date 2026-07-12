import fs from "fs";
import path from "path";
const Parser = require("web-tree-sitter");

function findWasm(name: string) {
  const possiblePaths = [
    path.resolve(process.cwd(), `node_modules/tree-sitter-wasms/out/${name}`),
    path.resolve(__dirname, `../../node_modules/tree-sitter-wasms/out/${name}`),
    path.resolve(__dirname, `../../../node_modules/tree-sitter-wasms/out/${name}`)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return possiblePaths[0]; // fallback
}

const jsWasmPath = findWasm("tree-sitter-javascript.wasm");
const tsWasmPath = findWasm("tree-sitter-typescript.wasm");

/**
 * Recursively find all files in a directory.
 */
function walkDir(dir: string, fileList: string[] = []) {
  if (fileList.length >= 5000) return fileList; // Hard cap
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (fileList.length >= 5000) break;
    // Exclude common large/unnecessary directories
    if (['.git', 'node_modules', 'dist', 'build', '.next', 'out'].includes(file)) continue;
    // Exclude lockfiles
    if (['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'].includes(file)) continue;
    
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walkDir(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

let parserInitialized = false;
let jsLanguage: any;
let tsLanguage: any;

async function initParser() {
  if ((global as any).treeSitterInitialized) {
    jsLanguage = (global as any).jsLanguage;
    tsLanguage = (global as any).tsLanguage;
    return;
  }
  await Parser.init();
  jsLanguage = await Parser.Language.load(jsWasmPath);
  tsLanguage = await Parser.Language.load(tsWasmPath);
  (global as any).treeSitterInitialized = true;
  (global as any).jsLanguage = jsLanguage;
  (global as any).tsLanguage = tsLanguage;
}

/**
 * Analyzes the AST of a codebase to identify High Value Targets (HVTs).
 * @param repoPath Path to the repository
 * @returns Array of relative paths to HVT files
 */
export async function analyzeAST(repoPath: string): Promise<{ hvtFiles: string[], capHit: boolean }> {
  let capHit = false;
  const hvtFiles: string[] = [];

  // BYPASS AST PARSING FOR RENDER FREE TIER (OOM FIX)
  // We skip loading web-tree-sitter to prevent blowing past 512MB RAM.
  console.log(`[RepoScannerAgent] AST parsing bypassed to prevent OOM crash.`);

  return { hvtFiles, capHit };
}

