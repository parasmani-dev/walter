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
  if (parserInitialized) return;
  await Parser.init();
  jsLanguage = await Parser.Language.load(jsWasmPath);
  tsLanguage = await Parser.Language.load(tsWasmPath);
  parserInitialized = true;
}

/**
 * Analyzes the AST of a codebase to identify High Value Targets (HVTs).
 * @param repoPath Path to the repository
 * @returns Array of relative paths to HVT files
 */
export async function analyzeAST(repoPath: string): Promise<{ hvtFiles: string[], capHit: boolean }> {
  await initParser();
  let capHit = false;
  const allFiles = walkDir(repoPath);
  if (allFiles.length >= 5000) {
    capHit = true;
    console.warn(`[RepoScannerAgent] WARNING: Hard cap of 5000 files reached. Scanning may be incomplete.`);
  }
  const hvtFiles: string[] = [];

  const parser = new Parser();

  for (const filePath of allFiles) {
    const ext = path.extname(filePath);
    if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      continue;
    }

    if (ext === '.ts' || ext === '.tsx') {
      parser.setLanguage(tsLanguage);
    } else {
      parser.setLanguage(jsLanguage);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const tree = parser.parse(content);
    
    let isHVT = false;

    // Walk the AST looking for HVT patterns
    const walkNode = (node: any) => {
      if (isHVT) return; // fast exit
      
      // Look for auth-related imports: `import jwt from 'jsonwebtoken'` or `require('passport')`
      if (node.type === 'import_statement') {
        const text = node.text.toLowerCase();
        if (text.includes('jsonwebtoken') || text.includes('passport') || text.includes('express-jwt')) {
          isHVT = true;
        }
      }

      if (node.type === 'call_expression') {
        const text = node.text;
        // e.g. require('jsonwebtoken') or jwt.verify()
        if (text.includes('require(') && (text.includes('jsonwebtoken') || text.includes('passport'))) {
          isHVT = true;
        }
        if (text.includes('jwt.verify') || text.includes('jwt.sign')) {
          isHVT = true;
        }
      }

      // Check route handlers that might be auth controllers (e.g. router.post('/login', ...))
      if (node.type === 'string_fragment' || node.type === 'string') {
        const val = node.text.replace(/['"`]/g, '').toLowerCase();
        if (val === '/login' || val === '/auth' || val === '/register') {
          isHVT = true;
        }
      }

      for (const child of node.namedChildren) {
        walkNode(child);
      }
    };

    walkNode(tree.rootNode);

    if (isHVT) {
      hvtFiles.push(path.relative(repoPath, filePath));
    }
  }

  return { hvtFiles, capHit };
}

