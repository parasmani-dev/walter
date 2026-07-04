import fs from "fs";
import path from "path";
const Parser = require("web-tree-sitter");

const jsWasmPath = path.resolve(__dirname, "../../../../node_modules/tree-sitter-wasms/out/tree-sitter-javascript.wasm");
const tsWasmPath = path.resolve(__dirname, "../../../../node_modules/tree-sitter-wasms/out/tree-sitter-typescript.wasm");

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
    return matches;
  }

  const sinks = ['eval', 'exec', 'res.send', 'query']; // 'query' for SQL
  const sources = ['req.query', 'req.body', 'req.params'];

  const walkNode = (node: any) => {
    // Look for call_expression nodes
    if (node.type === 'call_expression' && node.namedChildren.length > 0) {
      const calleeText = node.namedChildren[0].text;
      const fullText = node.text;
      
      let matchedSink = sinks.find(s => {
        return calleeText === s || calleeText.endsWith('.' + s);
      });

      if (matchedSink) {
        // If the sink call arguments contain a known source text, flag it.
        // The arguments are typically from index 1 onwards.
        // For simplicity in a hackathon, we just check if the full node text contains the source.
        const matchedSource = sources.find(s => fullText.includes(s));
        if (matchedSource) {
          
          let owaspCategory = "API8:2023 Security Misconfiguration"; // Default
          if (calleeText.includes('exec') || calleeText === 'eval') {
            owaspCategory = "API8:2023 Security Misconfiguration"; 
          }

          let enclosingFunction = "global";
          let curr = node.parent;
          while (curr) {
            if (curr.type === 'function_declaration' || curr.type === 'arrow_function' || curr.type === 'method_definition') {
              enclosingFunction = curr.type; // simplistically, we could extract the name, but type is okay
              if (curr.type === 'function_declaration' && curr.namedChildren[0]) {
                enclosingFunction = curr.namedChildren[0].text;
              }
              break;
            }
            curr = curr.parent;
          }

          const snippetHash = fullText.replace(/\s+/g, '');
          
          matches.push({
            line: node.startPosition.row + 1,
            sink: matchedSink,
            source: matchedSource,
            owaspCategory,
            severity: "CRITICAL",
            snippetHash,
            enclosingFunction
          });
        }
      }
    }

    for (const child of node.namedChildren) {
      walkNode(child);
    }
  };

  walkNode(tree.rootNode);
  return matches;
}
