# Product Requirements Document (PRD): Walter - GitHub Security Posture Agent

## 0. Industry Scope & Market Context

### Market Problem
The global application security market is projected to reach **$25 billion by 2029 (Gartner)**. Despite this growth, enterprise security teams face a critical "revolving door" problem: security regressions where previously patched vulnerabilities or hardcoded secrets are reintroduced into the codebase during rapid development cycles. Current static analysis tools lack the long-term semantic memory to distinguish between a brand-new risk and a recurring architectural failure.

### Competitive Landscape
| Tool | Secret Detection | Vuln Scanning | Regression Memory |
| :--- | :--- | :--- | :--- |
| Snyk | YES | YES | NO |
| GitGuardian | YES | NO | NO |
| Semgrep | NO | YES | NO |
| **Walter** | **YES** | **YES** | **YES** |

### Walter's Unique Value Proposition
Walter’s unique differentiator is its **Qdrant-powered Vector Memory**, which enables the system to identify when a previously fixed bug or secret pattern reappears. This "Regression Memory" creates a defensible moat by providing historical security context that traditional stateless scanners cannot replicate.

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
Walter is a decoupled, multi-agent security platform designed to monitor GitHub repositories. Unlike traditional scanners, Walter utilizes a microservices architecture orchestrated by the Mastra engine and AWS SQS to perform deep reconnaissance, secret detection, and vulnerability analysis with a specialized "Regression Memory" layer. It ensures high-fidelity results through Enkrypt AI guardrails and enforces strict data contracts via CI/CD validation gates.

## 2. Problem Statement
Enterprise codebases are susceptible to hardcoded secrets and complex vulnerabilities. Existing tools often suffer from:
1.  **Statelessness:** Forgetting previously resolved issues (regressions).
2.  **AI Hallucinations:** Security tools using LLMs often provide false positives or incorrect CVE data.
3.  **Scalability Bottlenecks:** Monolithic scanners fail under high-concurrency repository scans.
4.  **Data Leakage:** Transient storage of cloned code is often unencrypted.

## 3. Goals & Objectives
*   **Decoupled Scaling:** Independently scale agents based on specific resource profiles (CPU/Memory/IO).
*   **Zero-Drift Contracts:** Ensure 100% alignment between PRD schemas and runtime execution via CI/CD gates.
*   **Security First:** Implement SOC 2 compliant transient storage and OWASP API Security 2023 mitigations.
*   **High Fidelity:** Achieve a 0.85 cosine similarity threshold for regression detection.

## 4. Target Users / Stakeholders
*   **Security Engineers:** Reviewing high-fidelity findings and regression reports.
*   **DevOps Architects:** Managing the scalable infrastructure and CI/CD gates.
*   **Developers:** Receiving real-time feedback via the Walter Dashboard.

---

## 5. Functional Requirements

### FR-100: Repository Reconnaissance (RepoScannerAgent)
*   **FR-101:** Deep clone repositories to transient storage for analysis.
*   **FR-102:** Identify High Value Targets (HVTs) using Tree-sitter AST.
*   **FR-103:** Map repository structure and metadata to isolated PostgreSQL.
*   **FR-104:** Publish recon metadata to AWS SQS for downstream agents.
*   **FR-105:** Handle GitHub API rate limits via Redis-backed controller.

### FR-200: Secret Detection (SecretDetectorAgent)
*   **FR-201:** Detect secrets using Shannon entropy (>4.5).
*   **FR-202:** Apply regex signature matching for known providers.
*   **FR-203:** Implement 2-of-3 signal rule for high-confidence detection.
*   **FR-204:** Mask sensitive findings before storage or dashboard display.
*   **FR-205:** Suppress known false positives based on contextual heuristics.

### FR-300: Vulnerability Analysis (VulnAnalyzerAgent)
*   **FR-301:** Perform source-to-sink taint-flow analysis using AST.
*   **FR-302:** Integrate with GHSA API for real-time CVE lookups.
*   **FR-303:** Assign CWE IDs and calculate CVSS v4.0 scores.
*   **FR-304:** Detect OWASP Top 10 and API Security 2023 risks.
*   **FR-305:** Stream findings to the SQS bus for memory processing.

### FR-400: Security Memory (RegressionMemoryAgent)
*   **FR-401:** Store findings in Qdrant vector database using `text-embedding-3-small`.
*   **FR-402:** Detect regressions using a 0.85 cosine similarity threshold.
*   **FR-403:** Track finding lifecycle: NEW, PERSISTENT, RESOLVED, REGRESSION.
*   **FR-404:** Query historical context to provide "Security Posture Delta."
*   **FR-405:** Manage Qdrant connection pools to prevent exhaustion.

### FR-500: Validation & Guardrails (ValidationAgent)
*   **FR-501:** Filter LLM hallucinations using Enkrypt AI.
*   **FR-502:** Verify code snippets against original source files.
*   **FR-503:** Validate all agent outputs against Zod schemas.

### FR-600: Reporting & Dashboard (ReportSynthesizerAgent)
*   **FR-601:** Calculate 0-100 Security Posture Score.
*   **FR-602:** Generate 3-sentence executive summaries per scan.
*   **FR-603:** Stream real-time updates to Next.js dashboard via WebSockets.
*   **FR-604:** Aggregate findings into a final Markdown report.

---

## 6. Non-Functional Requirements (NFR)

| ID | Category | Statement | AC-1 (Threshold) | AC-2 (Verification) | OWASP 2023 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-101 | Performance | P95 scan latency <45s repos <1000 files | <45 seconds | CloudWatch Logs | N/A |
| NFR-102 | Performance | Qdrant query latency <100ms | <100ms | OpenTelemetry Trace | N/A |
| NFR-103 | Performance | WebSocket frequency >2Hz active scan | >2Hz | Chrome DevTools | N/A |
| NFR-201 | Security | TLS 1.3 enforced TLS 1.2 forbidden | 100% Enforcement | SSL Labs Scan | API8:2023 |
| NFR-202 | Security | AES-256-GCM AWS KMS PATs at rest | 256-bit | AWS KMS Audit Logs | API3:2023 |
| NFR-203 | Security | OWASP API Top 10 2023 100% coverage | 10/10 Risks | Pentest Report | API1-10 |
| NFR-301 | Reliability | 99.9% uptime SLA API Gateway | 99.9% | UptimeRobot | N/A |
| NFR-302 | Reliability | Agent crash MTTR <30s via SQS DLQ | <30 seconds | ECS Event Stream | N/A |
| NFR-401 | Scalability | 50 concurrent scans Redis rate limiter | 50 Scans | JMeter Load Test | API4:2023 |
| NFR-402 | Scalability | ECS scale-out trigger 70% CPU | 70% Utilization | CloudWatch Alarm | N/A |
| NFR-501 | Observability | 100% OTel trace all 5 agents | 100% Coverage | Honeycomb/Axiom | N/A |
| NFR-502 | Observability | 100% JSON stdout log compliance | 100% JSON | CloudWatch Insights | N/A |

---

## 7. System Architecture Overview
Walter utilizes a **Decoupled Micro-Agent Architecture**.
*   **Orchestration:** Mastra Workflow Engine manages high-level state.
*   **Messaging:** AWS SQS acts as the "Agent Bus" for asynchronous task distribution.
*   **Isolation:** Each agent (RepoScanner, SecretDetector, etc.) has its own dedicated PostgreSQL database to prevent data contention.
*   **Validation:** CI/CD Validation Gates enforce Zod schema compliance before deployment.

## 8. Tech Stack
*   **Runtime:** Node.js 20.x LTS, TypeScript 5.x.
*   **Frameworks:** Express 4.18 (Hardened), Mastra SDK v0.1.x.
*   **Persistence:** PostgreSQL (Prisma ORM), Qdrant (Vector), Redis (Cache).
*   **AI/ML:** OpenAI `text-embedding-3-small`, Enkrypt AI (Guardrails).
*   **Infrastructure:** AWS ECS/Fargate, AWS SQS, AWS KMS, Vercel (Frontend).
*   **Observability:** OpenTelemetry, CloudWatch.

---

## 9. Data Requirements
*   **Database-per-Service:** Each agent owns its schema.
*   **Vector Store:** Qdrant stores security embeddings with HNSW indexing.
*   **Schema Enforcement:** Zod v3.x for all inter-agent messages.

## 10. API Specifications & OWASP Mapping

| OWASP ID | Risk Name (2023) | Walter Exposed? | Walter-Specific Attack Vector | Mitigation in Walter | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| API1:2023 | Broken Object Level Authorization | YES | Accessing reports of other orgs via `report_id` | Prisma Middleware RBAC | Automated IDOR Tests |
| API2:2023 | Broken Authentication | YES | Brute forcing GitHub PAT submission | JWT + AWS KMS + Redis | Auth0 Fuzzer |
| API3:2023 | Broken Object Property Level Authorization | PARTIAL | Leaking internal agent metadata in API response | Zod Schema Filtering | Schema Diff Check |
| API4:2023 | Unrestricted Resource Consumption | YES | Triggering 1000s of scans to exhaust Fargate | Redis Rate Limiter | Load Testing |
| API5:2023 | Broken Function Level Authorization | YES | Non-admins calling `/api/admin/purge` | Express-RBAC Middleware | Role-based Unit Tests |
| API6:2023 | Unrestricted Access to Sensitive Business Flows | NO | Automated scan triggering | Redis Fixed Window | Rate Limit Logs |
| API7:2023 | Server Side Request Forgery | YES | RepoScannerAgent fetching malicious URLs | VPC Egress Filtering | Network Audit |
| API8:2023 | Security Misconfiguration | YES | Permissive CORS or TLS 1.1 usage | TLS 1.3 + Helmet.js | Security Monkey |
| API9:2023 | Improper Inventory Management | PARTIAL | Unused beta agent endpoints | Versioned API Paths | OpenAPI Spec Audit |
| API10:2023 | Unsafe Consumption of APIs | YES | Malicious GHSA or Enkrypt AI responses | Zod Validation Gates | Mock Injection Tests |

---

## 11. Security Requirements

### Transient Storage Encryption Specification
**Threat Model:** An attacker gaining access to the RepoScannerAgent container could read unencrypted source code or secrets from the local disk during the cloning phase.
**Encryption Method:** AES-256-XTS for disk-backed fallback; primary storage uses RAM-based tmpfs.
**Key Source:** Ephemeral keys generated per-task via AWS KMS.
**Storage Location:** `/mnt/transient_code` (Docker tmpfs mount).
**Lifecycle:** Encrypted on write, decrypted on read by RepoScannerAgent, purged immediately after SQS message publication.
**Purge Trigger:** Completion of `RepoScannerAgent` task or container SIGTERM.
**Purge Method:** Cryptographic erase (deletion of ephemeral key) and `shred` on disk fallback.
**NFR Addition:** **NFR-204:** Transient data must not persist >300s. AC: Automated cleanup verified by ECS task lifecycle hooks.

---

## 12. Deployment & Infrastructure

### 12-Factor Compliance Table
| Factor # | Factor Name | Walter Implementation | Compliance |
| :--- | :--- | :--- | :--- |
| I | Codebase | GitHub Repository with per-agent subdirectories | FULL |
| II | Dependencies | `package.json` with strict version pinning | FULL |
| III | Config | GITHUB_TOKEN, QDRANT_URL, QDRANT_API_KEY, ENKRYPT_API_KEY, SQS_QUEUE_URL | FULL |
| IV | Backing Services | PostgreSQL, Redis, Qdrant treated as attached resources | FULL |
| V | Build, Release, Run | GitHub Actions CI/CD pipeline | FULL |
| VI | Processes | Mastra agents stateless, state in PostgreSQL/Redis/Qdrant | FULL |
| VII | Port Binding | Agents export services via port binding (Express/gRPC) | FULL |
| VIII | Concurrency | Horizontal scaling via AWS ECS/Fargate | FULL |
| IX | Disposability | Fast startup/shutdown via Docker/SQS | FULL |
| X | Dev/Prod Parity | Docker Compose for local, ECS for production | FULL |
| XI | Logs | OpenTelemetry JSON to stdout | FULL |
| XII | Admin Processes | /scripts directory, one-off tasks | FULL |

### Dynamic Scaling Specification

| Agent | Primary Resource | Scale-Out Trigger | Scale-In Trigger | Min Instances | Max Instances | Cooldown Period |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| RepoScanner | I/O Bound | SQS Depth > 10 | SQS Depth < 2 | 2 | 10 | 60s |
| SecretDetector | CPU Bound | CPU > 70% | CPU < 30% | 2 | 20 | 120s |
| VulnAnalyzer | CPU Bound | CPU > 75% | CPU < 25% | 2 | 20 | 120s |
| RegressionMemory | Memory Bound | Memory > 80% | Memory < 40% | 2 | 5 | 300s |
| ReportSynthesizer | Low Resource | SQS Depth > 50 | SQS Depth < 5 | 1 | 3 | 60s |

**Scaling Rationale:**
*   **RepoScannerAgent:** Bottlenecked by GitHub API and Disk I/O. Scales based on `SQS ApproximateNumberOfMessagesVisible`.
*   **SecretDetector/VulnAnalyzer:** CPU intensive due to regex and AST parsing. Uses `ECS CPUUtilization` and SQS depth.
*   **RegressionMemoryAgent:** Memory bound due to vector operations. Scales on `MemoryUtilization`. Max instances capped at 5 to prevent Qdrant connection pool exhaustion.

### Environment Variable Registry
| Variable | Description | Required | Secret? | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| GITHUB_TOKEN | GitHub App/PAT for cloning | YES | YES | `ghp_v3ryS3cr3tT0k3n...` |
| QDRANT_URL | Vector DB Endpoint | YES | NO | `https://qdrant.walter.svc:6333` |
| QDRANT_API_KEY | Vector DB Auth | YES | YES | `a1b2c3d4e5f6...` |
| ENKRYPT_API_KEY | AI Guardrail Auth | YES | YES | `enk_987654321...` |
| OPENAI_API_KEY | Embedding API Key | YES | YES | `sk-proj-abc123xyz...` |
| OTEL_EXPORTER_OTLP_ENDPOINT | Telemetry Sink | YES | NO | `http://otel-collector:4317` |
| DATABASE_URL | PostgreSQL Connection | YES | YES | `postgresql://user:pass@db:5432/walter` |
| REDIS_URL | Cache Connection | YES | NO | `redis://cache.walter.svc:6379` |
| AWS_KMS_KEY_ID | Encryption Key ID | YES | NO | `arn:aws:kms:us-east-1:123:key/abc` |
| JWT_SECRET | API Auth Secret | YES | YES | `super-secret-jwt-key` |
| NODE_ENV | Environment Name | YES | NO | `production` |
| PORT | API Port | YES | NO | `3000` |
| WALTER_MAX_REPO_SIZE_MB | Scan Limit | YES | NO | `500` |
| WALTER_SCAN_TIMEOUT_SECONDS | Scan Deadline | YES | NO | `300` |
| SQS_QUEUE_URL | Agent Bus URL | YES | NO | `https://sqs.us-east-1.amazonaws.com/123/walter-bus` |

---

## 13. Success Metrics
*   **Regression Detection Rate:** >95% of reintroduced bugs flagged.
*   **False Positive Rate:** <5% through Enkrypt AI validation.
*   **System Latency:** End-to-end scan < 2 minutes for standard repos.
*   **Contract Compliance:** 0 build failures in production due to schema drift.

## 14. Timeline & Milestones
*   **Phase 1 (Core):** Mastra Orchestrator + RepoScanner + SecretDetector.
*   **Phase 2 (Memory):** Qdrant integration + RegressionMemoryAgent.
*   **Phase 3 (Hardening):** Enkrypt AI + CI/CD Validation Gates + Encryption Spec.
*   **Phase 4 (Scale):** Dynamic scaling policies + WebSocket Dashboard.

---

## 15. Open Questions & Risks
*   **Risk:** Qdrant connection limits during high-concurrency scaling. *Mitigation: Cap RegressionMemoryAgent instances.*
*   **Risk:** GitHub API secondary rate limits for large orgs. *Mitigation: Redis-backed token bucket controller.*

---

## 16. Requirements Traceability Matrix (RTM)

| Req ID | Requirement Title | Walter Agent | Implementation Component | Test Case ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-101 | Deep Clone Repos | RepoScannerAgent | Git/tmpfs | TC-101 | PLANNED |
| FR-102 | HVT Identification | RepoScannerAgent | Tree-sitter | TC-102 | PLANNED |
| FR-103 | Metadata Storage | RepoScannerAgent | Prisma/PostgreSQL | TC-103 | PLANNED |
| FR-104 | SQS Publication | RepoScannerAgent | AWS SDK | TC-104 | PLANNED |
| FR-105 | Rate Limiting | RepoScannerAgent | Redis | TC-105 | PLANNED |
| FR-201 | Entropy Detection | SecretDetectorAgent | Shannon Logic | TC-201 | PLANNED |
| FR-202 | Regex Matching | SecretDetectorAgent | Regex Engine | TC-202 | PLANNED |
| FR-203 | 2-of-3 Signal Rule | SecretDetectorAgent | Logic Engine | TC-203 | PLANNED |
| FR-204 | Secret Masking | SecretDetectorAgent | Masking Utility | TC-204 | PLANNED |
| FR-205 | FP Suppression | SecretDetectorAgent | Context Heuristics | TC-205 | PLANNED |
| FR-301 | Taint-flow Analysis | VulnAnalyzerAgent | AST Source-Sink | TC-301 | PLANNED |
| FR-302 | GHSA Integration | VulnAnalyzerAgent | GHSA API Client | TC-302 | PLANNED |
| FR-303 | CVSS Scoring | VulnAnalyzerAgent | CVSS v4 Calculator | TC-303 | PLANNED |
| FR-304 | OWASP Detection | VulnAnalyzerAgent | Security Ruleset | TC-304 | PLANNED |
| FR-305 | Findings Stream | VulnAnalyzerAgent | SQS Publisher | TC-305 | PLANNED |
| FR-401 | Vector Storage | RegressionMemoryAgent | Qdrant Client | TC-401 | PLANNED |
| FR-402 | Regression Detection | RegressionMemoryAgent | Cosine Similarity | TC-402 | PLANNED |
| FR-403 | Lifecycle Tracking | RegressionMemoryAgent | State Machine | TC-403 | PLANNED |
| FR-404 | Posture Delta | RegressionMemoryAgent | Analytics Engine | TC-404 | PLANNED |
| FR-405 | Connection Pooling | RegressionMemoryAgent | Qdrant Pool | TC-405 | PLANNED |
| FR-501 | Hallucination Filter | ValidationAgent | Enkrypt AI SDK | TC-501 | PLANNED |
| FR-502 | Snippet Verification | ValidationAgent | Source Matcher | TC-502 | PLANNED |
| FR-503 | Zod Validation | ValidationAgent | Zod Schemas | TC-503 | PLANNED |
| FR-601 | Posture Scoring | ReportSynthesizerAgent | Scoring Algorithm | TC-601 | PLANNED |
| FR-602 | Exec Summaries | ReportSynthesizerAgent | LLM/Template | TC-602 | PLANNED |
| FR-603 | WS Streaming | ReportSynthesizerAgent | Socket.io/WS | TC-603 | PLANNED |
| FR-604 | Markdown Reports | ReportSynthesizerAgent | MD Generator | TC-604 | PLANNED |
| NFR-101 | Scan Latency | N/A | ECS/SQS | TC-N101 | PLANNED |
| NFR-102 | Query Latency | RegressionMemoryAgent | Qdrant HNSW | TC-N102 | PLANNED |
| NFR-103 | WS Frequency | ReportSynthesizerAgent | WS Buffer | TC-N103 | PLANNED |
| NFR-201 | TLS 1.3 | N/A | API Gateway | TC-N201 | PLANNED |
| NFR-202 | AES Encryption | N/A | AWS KMS | TC-N202 | PLANNED |