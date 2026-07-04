import { Agent } from "@mastra/core/agent";
import { calculateScore } from "./tools/scoreCalculator";
import { generateJsonReport } from "./tools/jsonReport";
import { generateMarkdownReport } from "./tools/markdownReport";
import { processValidation } from "../ValidationAgent";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const ReportSynthesizerAgent = new Agent({
  name: "ReportSynthesizerAgent",
  id: "reportSynthesizerAgent",
  instructions: "You are the ReportSynthesizerAgent. Your job is to take findings and synthesize a final report.",
  model: {
    provider: "openai",
    name: "gpt-4o-mini",
    apiKey: "stub"
  } as any,
});

export async function runReportSynthesizer(repoMetadata: any, findings: any[]) {
  console.log(`[ReportSynthesizerAgent] Synthesizing report for ${repoMetadata.repositoryUrl}`);

  // 1. Calculate Score
  const score = calculateScore(findings);

  // 2. Draft AI Summary using Gemini
  let narrativeSummary = "";
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a security analyst. Write a concise 3-sentence summary of the following findings. Mention the repository ${repoMetadata.repositoryUrl}. Score is ${score.numericScore}/100. Findings: ${JSON.stringify(findings.map(f => f.finding))}`;
      const result = await model.generateContent(prompt);
      narrativeSummary = result.response.text();
    } else {
      narrativeSummary = `Analysis complete for ${repoMetadata.repositoryUrl}. Found ${findings.length} findings with a score of ${score.numericScore}.`;
    }
  } catch (e: any) {
    console.error("[ReportSynthesizerAgent] Failed to generate AI summary:", e.message);
    narrativeSummary = `Analysis complete. Found ${findings.length} findings.`;
  }

  // 3. Validation Agent (Guardrails)
  // We pass the findings and the drafted summary.
  const validationResults = await processValidation(findings, narrativeSummary);
  
  // Check if hallucination check failed and regenerated the summary
  const hallucinationResult = validationResults.find(v => v.checkType === "ENKRYPT_HALLUCINATION");
  if (hallucinationResult && (hallucinationResult.verdict === "FAIL" || hallucinationResult.verdict === "REGENERATED")) {
    console.log("[ReportSynthesizerAgent] Summary was flagged by ValidationAgent. Using fallback summary.");
    // In a real agent we would feed the error back to the LLM. Here we use the fallback from ValidationAgent or a safe default.
    narrativeSummary = "Analysis complete. The original AI summary was rejected by guardrails. Please review the structured findings below.";
  }

  // 4. Generate JSON Report
  const jsonReport = generateJsonReport(repoMetadata, findings, score, validationResults);

  // 5. Generate Markdown Report
  const markdownReport = generateMarkdownReport(jsonReport, narrativeSummary);

  return {
    jsonReport,
    markdownReport
  };
}
