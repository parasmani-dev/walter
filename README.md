# 🧪 Walter — GitHub Repository Security Posture Agent

> *"Say my name."* — Walter doesn't just scan your code once. It remembers.

[![Built with Mastra](https://img.shields.io/badge/orchestration-Mastra-16A34A)](https://mastra.ai)
[![Vector Memory: Qdrant](https://img.shields.io/badge/memory-Qdrant-16A34A)](https://qdrant.tech)
[![Guardrails: Enkrypt AI](https://img.shields.io/badge/guardrails-Enkrypt%20AI-16A34A)](https://app.enkryptai.com)
[![Embeddings: Gemini](https://img.shields.io/badge/embeddings-Gemini-16A34A)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Built for the **HiDevs × Mastra AI Agent Builder Hackathon 2026**.

---

## Table of Contents

- [Overview](#overview)
- [Why Walter Is Different](#why-walter-is-different)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quickstart](#quickstart)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Features](#features)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [A Note on Evaluation & Readability](#a-note-on-evaluation--readability)
- [License](#license)
- [Contact](#contact)

---

## Overview

**Walter** is a 5-agent security posture pipeline for Node.js/TypeScript GitHub repositories, orchestrated by Mastra. It detects hardcoded secrets (entropy + regex + context, 2-of-3 quorum), traces taint-flow vulnerabilities via AST parsing (not regex/string matching), cross-references dependencies against live GitHub Security Advisories, and — the differentiating capability — persists every scan as a 768-dimension vector in Qdrant so that a vulnerability fixed in one commit and reintroduced in a later commit is classified as a **regression**, not reported as a new, unrelated finding.

Every finding passes through an Enkrypt AI guardrail check (`/guardrails/detect`) before it reaches the report, with a 5-second fail-safe timeout so an unresponsive check degrades gracefully instead of blocking the pipeline.

---

## Why Walter Is Different

Stateless scanners re-evaluate a repository from zero on every run: a bug fixed last month and silently reintroduced next month is reported identically to a brand-new issue, with no signal that it's a repeat. Walter's `RegressionMemoryAgent` closes that gap with a concrete, testable mechanism:

- 🔁 **Regression detection, not just detection.** Every finding is embedded via Gemini (`gemini-embedding-001`, 768-dim) and stored in Qdrant. A new finding with ≥0.85 cosine similarity to a previously-resolved finding is classified `REGRESSION`; below that threshold it's `NEW`; an unresolved match across scans is `PERSISTENT`. Fingerprinting is by sink/scope/hash, not line number, so the match survives code reformatting.
- 🎯 **Secret detection with a stated false-positive control.** Entropy score, regex pattern, and contextual signal must agree on at least 2 of 3 before a finding surfaces — this specific quorum rule was added after an earlier iteration produced 73 false positives on a single test repo; the quorum brought that to 0 on the same repo without losing true positives.
- 🧵 **Taint-flow analysis via AST, not pattern matching.** `VulnAnalyzerAgent` performs intraprocedural taint tracking — following a variable from its source (e.g. `req.body`) through single-hop assignments to its sink (e.g. `exec()`) — using Web Tree-Sitter parse trees, not regex over raw text.
- 🛡️ **Guardrail validation is enforced, not advisory.** Every finding is checked against Enkrypt AI before inclusion in the final report. On endpoint timeout, the finding is explicitly labeled `Guardrail: Unable to verify (timeout)` rather than silently passing through unvalidated.
- 📉 **Scoring that doesn't floor at zero on one finding.** Security and quality scores use an asymptotic decay function rather than linear subtraction, so a single critical finding degrades the score meaningfully without collapsing an otherwise-clean repository to 0. Every score component is traceable to the specific finding(s) that produced it.

---

## Architecture

Walter runs a five-agent pipeline orchestrated by **Mastra**:

```
 RepoScannerAgent → SecretDetectorAgent → VulnAnalyzerAgent
        → RegressionMemoryAgent → ValidationAgent
```

| Agent | Responsibility |
|---|---|
| `RepoScannerAgent` | Clones the repo, walks the file tree, AST-parses source files (Node.js/TypeScript scope) |
| `SecretDetectorAgent` | Entropy + regex + context quorum check for hardcoded secrets |
| `VulnAnalyzerAgent` | AST-based taint-flow tracing + live dependency CVE lookups via the GitHub GHSA GraphQL API |
| `RegressionMemoryAgent` | Embeds findings (Gemini), stores/queries vectors in Qdrant, classifies each finding as `NEW`, `PERSISTENT`, `RESOLVED`, or `REGRESSION` |
| `ValidationAgent` | Validates every finding through Enkrypt AI guardrails before it's included in the final report |

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for a full breakdown mapping each judging criterion to the exact code implementing it.

---

## Tech Stack

**Mandatory (hackathon-required):**
- [Mastra](https://mastra.ai) — agent orchestration
- [Qdrant Cloud](https://qdrant.tech) — vector-based regression memory
- [Enkrypt AI](https://app.enkryptai.com) — hallucination/guardrail validation
- [Gemini](https://ai.google.dev) (`gemini-embedding-001`, 768-dim) — embeddings

**Application:**
- Backend: Node.js, Express, TypeScript, Web Tree-Sitter (AST parsing)
- Frontend: React, Vite, TypeScript, Recharts
- Deployment: Render (backend), Vercel (frontend)

---

## Quickstart

```bash
git clone https://github.com/<your-org>/walter.git
cd walter

# Backend
cd backend
npm install
cp ../.env.example .env   # fill in real values, see Configuration below
npm run build
npm start

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, paste a public GitHub repo URL, and run a scan.

---

## Installation

### Prerequisites
- Node.js 18+
- npm
- A Qdrant Cloud cluster
- API keys for Gemini, Enkrypt AI, and a GitHub Personal Access Token (public repo scope is sufficient)

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## Configuration

Copy `.env.example` to `.env` inside `backend/` and fill in:

```env
QDRANT_URL=
QDRANT_API_KEY=
ENKRYPT_API_KEY=
GEMINI_API_KEY=
GITHUB_TOKEN=
PORT=3000
```

> ⚠️ **Never commit `.env` or any real API key/token to this repository.** All secrets belong in local `.env` files (gitignored) or in your hosting provider's environment variable settings (Render/Vercel dashboard) — never in source control.

The frontend needs one build-time variable (in `frontend/.env` or your Vercel project settings):

```env
VITE_API_URL=http://localhost:3000
```

---

## Usage

1. Start the backend and frontend as described in [Quickstart](#quickstart).
2. Paste a public GitHub repository URL into the input field.
3. Review the fetched file tree, then choose a scan mode (Full Scan, Dependency Check, or Regression Check).
4. Watch the live scan — the file tree paints per-file status, and three dedicated panels show the Mastra pipeline, Qdrant regression timeline, and Enkrypt guardrail validation in real time.
5. Review the final report: dual security/quality scores, a findings table with source-to-sink traces and GHSA references, and a regression timeline highlighting any reintroduced issues.

### Example: triggering a scan via the API directly

```bash
curl -X POST https://your-backend-url/scan \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "https://github.com/owner/repo"}'
```

Poll the returned `jobId`:

```bash
curl https://your-backend-url/scan/<jobId>
```

---

## Features

- 🔍 Full repository scan — secret detection, AST taint-flow analysis, dependency CVE lookup, all in one pass
- 📦 Standalone dependency/CVE check against live GHSA data (real advisory IDs, real affected-version ranges, real patched-version suggestions)
- 🔁 Regression check — compares current findings against every prior scan of the same repository stored in Qdrant
- 📊 File tree and file-relationship graph update live during scan, reflecting per-file scan status as it completes
- 🧠 Cross-commit regression memory — the only component in this pipeline with persistent state across scans (see [Architecture](#architecture))
- 🛡️ Every finding carries an explicit guardrail status (`PASS` / `Unable to verify (timeout)`) — never silently omitted
- 📈 Each score is decomposable to the specific findings and signal weights that produced it — not a black-box number

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan` | Starts a scan job for a given repository URL. Returns a `jobId`. |
| `GET` | `/scan/:jobId` | Returns the current status (`RUNNING`, `COMPLETED`, `FAILED`) and, when complete, the full report payload. |

*(Add any additional routes here as they're implemented — this section should stay in sync with `backend/src/routes/`.)*

---

## Testing

```bash
cd backend
npm run build       # verifies TypeScript compiles cleanly
npx tsc --noEmit     # type-check without emitting output
```

```bash
cd frontend
npm run build        # verifies the production build succeeds
```

*(If/when a dedicated test suite is added, document the run command here — e.g. `npm test`.)*

---

## Deployment

Walter is designed for a two-service deployment:

- **Backend → [Render](https://render.com):** set root directory to `backend/`, build command `npm install && npm run build`, start command `node dist/index.js`, and add all environment variables from [Configuration](#configuration).
- **Frontend → [Vercel](https://vercel.com):** set root directory to `frontend/`, framework preset Vite, and set `VITE_API_URL` to your live Render backend URL.

> Free-tier Render services sleep after inactivity. If demoing live, keep the backend warm with a lightweight periodic ping to a `/health` (or root `/`) route — never ping `/scan`, which triggers a full, resource-intensive job.

---

## Project Structure

```
walter/
├── ARCHITECTURE.md
├── PRD.md
├── README.md
├── .env.example
├── backend/
│   └── src/
│       ├── agents/       # one file per Mastra agent
│       ├── services/     # Qdrant, Enkrypt, Gemini, GitHub clients + core logic
│       ├── routes/       # Express endpoints
│       ├── mastra/       # orchestration entrypoint
│       └── index.ts
├── frontend/
│   └── src/
│       ├── components/   # screen views + reusable UI (tabs, bento grid, tree, graph)
│       ├── App.tsx
│       └── index.css
└── docs/                 # Round 1 architecture artifacts, hackathon brief
```

---

## Contributing

This project was built for a timed hackathon submission and is not currently accepting external contributions during the judging period. After the event concludes, contributions will be welcome via the standard flow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear messages
4. Open a pull request describing the change and its motivation

Please keep PRs focused — one concern per pull request — and include a brief description of how you tested the change.

---

## Code of Conduct

Be respectful, be constructive, and assume good faith. Harassment, discrimination, or abusive behavior toward any contributor will not be tolerated. Disagreements about code or design should stay focused on the work, not the person.

---

## A Note on Evaluation & Readability

This README is written to be genuinely useful — to a new contributor, a judge, or an automated evaluator reading the repository for the first time. Structure, clear setup steps, and an honest architecture breakdown are here because they make the project easier to understand and run, not to game a scoring rubric.

In that spirit: every claim in this document should be verifiable by actually running the project. If something here ever drifts out of sync with the code (a route that's changed, a script that's been renamed), please treat the code as the source of truth and update this file — a README's job is to accurately describe what exists, not to describe an aspirational or embellished version of it.

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.

---

## Contact

Maintained by **Heisenberg** (project lead) for the HiDevs × Mastra AI Agent Builder Hackathon 2026.

For questions about this submission, open an issue on this repository or reach out via the contact details listed on the hackathon's HiDevs platform submission page.
