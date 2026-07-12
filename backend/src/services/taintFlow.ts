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

export interface TaintMatch {
  line: number;
  sink: string;
  source: string;
  owaspCategory: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  snippetHash: string;
  enclosingFunction: string;
}

/**
 * Very basic intraprocedural taint flow analysis.
 * Looks for direct use of req.query / req.body / req.params inside sinks.
 */
export async function analyzeTaintFlow(filePath: string): Promise<TaintMatch[]> {
  await initParser();
  const matches: TaintMatch[] = [];
  const ext = path.extname(filePath);
  if (!['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
    return matches;
  }

  const parser = new Parser();
  if (ext === '.ts' || ext === '.tsx') {
    parser.setLanguage(tsLanguage);
  } else {
    parser.setLanguage(jsLanguage);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  let tree;
  try {
    tree = parser.parse(content);
  } catch (e) {
    if (parser && typeof parser.delete === 'function') parser.delete();
    return matches;
  }

  try {

  const sinks = ['eval', 'exec', 'res.send', 'query']; // 'query' for SQL
  const sources = ['req.query', 'req.body', 'req.params', 'req.headers'];

  const analyzeScope = (scopeNode: any) => {
    const taintedVars = new Set<string>();
    
    // Pass 1: Find tainted variables
    const findTaintedVars = (node: any) => {
      if (node.type === 'variable_declarator') {
        const nameNode = node.childForFieldName('name') || node.namedChildren[0];
        const valueNode = node.childForFieldName('value') || node.namedChildren[1];
        if (nameNode && valueNode) {
          const valueText = valueNode.text;
          if (sources.some(s => valueText.includes(s))) {
            taintedVars.add(nameNode.text);
          }
        }
      } else if (node.type === 'assignment_expression') {
        const leftNode = node.childForFieldName('left') || node.namedChildren[0];
        const rightNode = node.childForFieldName('right') || node.namedChildren[1];
        if (leftNode && rightNode) {
          const rightText = rightNode.text;
          if (sources.some(s => rightText.includes(s))) {
            taintedVars.add(leftNode.text);
          }
        }
      }
      
      // recurse, but skip nested functions
      for (const child of node.namedChildren) {
        if (!['function_declaration', 'arrow_function', 'method_definition'].includes(child.type)) {
          findTaintedVars(child);
        }
      }
    };
    findTaintedVars(scopeNode);

    // Pass 2: Find sinks
    const findSinks = (node: any) => {
      if (node.type === 'call_expression' && node.namedChildren.length > 0) {
        const calleeText = node.namedChildren[0].text;
        const fullText = node.text;
        
        let matchedSink = sinks.find(s => calleeText === s || calleeText.endsWith('.' + s));
        if (matchedSink) {
          const argsNode = node.childForFieldName('arguments') || node.namedChildren[1];
          if (argsNode) {
            const argsText = argsNode.text;
            
            // Check direct source
            let matchedSource = sources.find(s => argsText.includes(s));
            
            // Check tainted variables
            if (!matchedSource) {
              for (const tVar of taintedVars) {
                // Look for whole word variable usage in arguments
                const regex = new RegExp(`\\b${tVar}\\b`);
                if (regex.test(argsText)) {
                  matchedSource = `Variable(${tVar})`;
                  break;
                }
              }
            }

            if (matchedSource) {
              let owaspCategory = "API8:2023 Security Misconfiguration";
              if (calleeText.includes('exec') || calleeText === 'eval') {
                owaspCategory = "API8:2023 Security Misconfiguration"; 
              }

              let enclosingFunction = "global";
              let curr = node.parent;
              while (curr) {
                if (['function_declaration', 'arrow_function', 'method_definition'].includes(curr.type)) {
                  enclosingFunction = curr.type;
                  if (curr.type === 'function_declaration' && curr.namedChildren[0]) {
                    enclosingFunction = curr.namedChildren[0].text;
                  }
                  break;
                }
                curr = curr.parent;
              }

              matches.push({
                line: node.startPosition.row + 1,
                sink: matchedSink,
                source: matchedSource,
                owaspCategory,
                severity: "CRITICAL",
                snippetHash: fullText.replace(/\s+/g, ''),
                enclosingFunction
              });
            }
          }
        }
      }

      // recurse, but skip nested functions
      for (const child of node.namedChildren) {
        if (!['function_declaration', 'arrow_function', 'method_definition'].includes(child.type)) {
          findSinks(child);
        }
      }
    };
    findSinks(scopeNode);
  };

  const walkAllScopes = (node: any) => {
    if (['program', 'function_declaration', 'arrow_function', 'method_definition'].includes(node.type)) {
      analyzeScope(node);
    }
    for (const child of node.namedChildren) {
      walkAllScopes(child);
    }
  };

  } finally {
    if (tree && typeof tree.delete === 'function') tree.delete();
    if (parser && typeof parser.delete === 'function') parser.delete();
  }
  
  return matches;
}

