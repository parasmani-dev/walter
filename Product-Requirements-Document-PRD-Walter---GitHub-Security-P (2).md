# Product Requirements Document (PRD): Walter - GitHub Security Posture Agent

## 0. Industry Scope & Market Context

### Market Problem
The global application security market is projected to reach **$25 billion by 2029 (Gartner)**. Despite this growth, enterprise security teams face a critical "revolving door" problem: security regressions where previously patched vulnerabilities or hardcoded secrets are reintroduced into the codebase during rapid development cycles. Current static analysis tools lack the long-term semantic memory to distinguish between a brand-new risk and a recurring architectural failure.

### Competitive Landscape
| Tool | Secret Detection | Vuln Scanning | Regression Memory | Enkrypt AI Validation |
| :--- | :--- | :--- | :--- | :--- |
| Snyk | YES | YES | NO | NO |
| GitGuardian | YES | NO | NO | NO |
| Semgrep | NO | YES | NO | NO |
| **Walter** | **YES** | **YES** | **YES** | **YES** |

### Walter's Unique Value Proposition
Walter’s unique differentiator is its **Qdrant-powered Vector Memory**, which enables the system to identify when a previously fixed bug or secret pattern reappears. Combined with **Mastra Agents** for intelligent orchestration and **Enkrypt AI Guardrails** for zero-hallucination reporting, Walter provides historical security context and high-fidelity output that traditional stateless scanners cannot replicate.

### Target Enterprise Buyer
*   **Title:** CISO or VP of Engineering.
*   **Company Size:** Mid-to-large enterprises (500+ developers).
*   **Budget Authority:** Security Operations (SecOps) or DevSecOps tooling budget.

### Business Impact Metrics
*   **Time Saved:** 40% reduction in manual triage by automatically flagging recurring issues.
*   **Risk Reduced:** 90% decrease in "Mean Time to Re-infection" for known security patterns.
*   **Cost Avoided:** Significant reduction in bug bounty payouts and breach remediation costs by catching regressions before production.

---

## 1. Executive Summary
Walter is a multi-agent security platform designed to monitor GitHub repositories. Unlike traditional scanners, Walter utilizes a micro-agent architecture orchestrated by the **Mastra engine** to perform deep reconnaissance, secret detection, and vulnerability analysis. It leverages **Qdrant** for semantic "Regression Memory" and ensures high-fidelity, hallucination-free results through **Enkrypt AI guardrails**.

## 2. Problem Statement
Enterprise codebases are susceptible to hardcoded secrets and complex vulnerabilities. Existing tools often suffer from:
1.  **Statelessness:** Forgetting previously resolved issues (regressions).
2.  **AI Hallucinations:** Security tools using LLMs often provide false positives or incorrect CVE data.
3.  **Data Overload:** Too many alerts with no intelligent synthesis or validation.

## 3. Goals & Objectives
*   **Intelligent Orchestration:** Utilize Mastra agents to independently handle distinct stages of the security scan.
*   **Zero-Hallucination Reporting:** Enforce strict AI safety and risk checks using Enkrypt AI.
*   **Semantic Memory:** Detect regressions with high fidelity using Qdrant vector similarity search.
*   **Actionable Dashboard:** Provide a minimal, functional React dashboard to consume the scan results in real-time.

## 4. Target Users / Stakeholders
*   **Security Engineers:** Reviewing high-fidelity findings and regression reports.
*   **Developers:** Receiving real-time feedback via the Walter Dashboard.

---

## 5. Functional Requirements

### FR-100: Repository Reconnaissance (RepoScannerAgent)
*   **FR-101:** Deep clone repositories to transient storage for analysis.
*   **FR-102:** Identify High Value Targets (HVTs) using Tree-sitter AST.
*   **FR-103:** Parse repository structure and pass metadata to the Mastra pipeline.
*   **FR-104:** Enforce a 5,000 file hard-cap limit to prevent system exhaustion.

### FR-200: Secret Detection (SecretDetectorAgent)
*   **FR-201:** Detect secrets using Shannon entropy (>4.5).
*   **FR-202:** Apply regex signature matching for known providers.
*   **FR-203:** Mask sensitive findings before processing or dashboard display.

### FR-300: Vulnerability Analysis (VulnAnalyzerAgent)
*   **FR-301:** Perform source-to-sink taint-flow analysis using AST.
*   **FR-302:** Detect risky patterns (e.g., `eval`, `exec`, `child_process`).
*   **FR-303:** Pass findings to the in-memory agent bus.

### FR-400: Security Memory (RegressionMemoryAgent - Mandatory Tech)
*   **FR-401:** Store findings in **Qdrant** vector database using `gemini-embedding-001`.
*   **FR-402:** Detect regressions using cosine similarity threshold matching.
*   **FR-403:** Track finding lifecycle: NEW, PERSISTENT, RESOLVED.
*   **FR-404:** Provide historical context to calculate the "Security Posture Delta."

### FR-500: Validation & Guardrails (ValidationAgent - Mandatory Tech)
*   **FR-501:** Filter LLM hallucinations using **Enkrypt AI** `/guardrails/hallucination`.
*   **FR-502:** Enforce AI Safety checking for toxicity and bias using **Enkrypt AI** `/guardrails/detect`.
*   **FR-503:** Calculate a unified Risk Score based on Injection, PII, and Policy Violation detection via **Enkrypt AI**.
*   **FR-504:** Validate all agent outputs against Zod schemas.

### FR-600: Reporting & Dashboard (ReportSynthesizerAgent)
*   **FR-601:** Calculate 0-100 Security Posture Score and A-F Grade.
*   **FR-602:** Generate an executive summary using Gemini.
*   **FR-603:** Stream real-time updates to the React/Vite dashboard via Express API polling.
*   **FR-604:** Aggregate findings and Enkrypt AI verdicts into a final structured JSON report.

---

## 6. System Architecture Overview
Walter utilizes a **Sequential Micro-Agent Architecture**.
*   **Orchestration:** **Mastra Workflow Engine** manages high-level state and agent coordination.
*   **Messaging:** An in-memory Job Queue inside an Express server acts as the "Agent Bus".
*   **Memory:** **Qdrant** serves as the persistent vector store for regression detection.
*   **Validation:** **Enkrypt AI** provides the core security validation layer against LLM hallucinations and risks.

## 7. Tech Stack (Mandatory Requirements)
*   **Orchestration:** Mastra SDK (Agents and Workflows).
*   **Vector Database:** Qdrant (Semantic similarity and regression memory).
*   **AI Guardrails:** Enkrypt AI (Hallucination detection, Safety checks, Risk scoring).
*   **LLM Engine:** Google Gemini (`gemini-1.5-flash`, `gemini-embedding-001`).
*   **Backend:** Node.js, Express, TypeScript.
*   **Frontend:** React, Vite, TailwindCSS (V4).

---

## 8. Data Requirements
*   **Vector Store:** Qdrant stores security embeddings with 768 dimensions.
*   **Schema Enforcement:** Zod v3.x for all inter-agent messages and outputs.
*   **Transient Storage:** Cloned code exists only during the scan lifecycle and is purged immediately upon completion.

---

## 9. Implementation Phases & Milestones

*   **Phase 1 (Core Scanning with Mastra):** 
    *   Implement **Mastra** Orchestrator.
    *   Build `RepoScannerAgent` and `SecretDetectorAgent`.
    *   Implement `VulnAnalyzerAgent` for AST-based parsing.
*   **Phase 2 (Semantic Memory with Qdrant):** 
    *   Integrate **Qdrant** vector database.
    *   Build `RegressionMemoryAgent` using Gemini embeddings to identify NEW vs RESOLVED findings.
*   **Phase 3 (AI Guardrails with Enkrypt AI):** 
    *   Implement `ValidationAgent`.
    *   Integrate **Enkrypt AI** hallucination checks on generated reports.
    *   Integrate **Enkrypt AI** safety and risk scoring on all findings.
*   **Phase 4 (Synthesis & UI):** 
    *   Build `ReportSynthesizerAgent` to compile scores and Enkrypt verdicts.
    *   Develop the React/Vite Minimal Functional Dashboard for real-time polling and report visualization.

---

## 10. Success Metrics
*   **Regression Detection Rate:** High accuracy matching in Qdrant for reintroduced bugs.
*   **Hallucination Prevention:** 100% of LLM-generated summaries pass through Enkrypt AI guardrails.
*   **System Usability:** End-to-end scan observable via the React dashboard with distinct error handling.
*   **Hackathon Compliance:** Strict usage and implementation of Mastra, Qdrant, and Enkrypt AI throughout the pipeline.