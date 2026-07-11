# Walter 🛡️

**Secure Every Repository Before It Breaks.**

Walter is a zero-configuration, multi-agent security orchestrator designed for modern enterprise teams. Instead of struggling with YAML pipelines, Docker images, and rulesets, simply provide your GitHub repository URL. Walter automatically clones, parses ASTs, tracks data taint flows, and cross-references vulnerabilities against the GHSA database. 

What sets Walter apart is its **Regression Memory Engine** powered by Qdrant, allowing the AI to semantically remember past states and instantly identify new regressions vs. resolved fixes. Every finding is ruthlessly vetted by Enkrypt AI to aggressively filter out hallucinations and false positives, ensuring developers only ever see actionable, high-signal alerts.

Designed to feel like a premium Apple or Vercel product, Walter is lightning-fast, beautiful, and completely autonomous.

---

> **⚠ PUBLIC SAFETY NOTICE**
> Nothing confidential — API keys, tokens, credentials, .env files, PATs — should ever be committed to this public GitHub repo. All secrets live securely in Render/Vercel environment variables only. 

## Structure
- `backend/src/agents/`: Mastra orchestrator and AI agent definitions.
- `backend/src/services/`: Core integrations (Qdrant, Enkrypt, Gemini, GitHub).
- `frontend/src/`: React frontend with liquid physics grid and premium dashboard.
- `ARCHITECTURE.md`: Detailed breakdown of our tech stack and AI judge mapping.

## Setup
Check `.env.example` for required environment variables.
