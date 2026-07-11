import React from 'react';
import { Workflow, Database, ShieldCheck, Key, Bug, BarChart, Mouse } from 'lucide-react';
import { motion } from 'framer-motion';

import Navbar from './Navbar';
import BackgroundEffects from './BackgroundEffects';
import Hero from './Hero';
import FeatureMarquee from './FeatureMarquee';
import TechTabShowcase from './TechTabShowcase';
import type { TabConfig } from './TechTabShowcase';
import BentoGrid from './BentoGrid';

interface LandingViewProps {
  onGetStarted: () => void;
}

const SECTION_A_TABS: TabConfig[] = [
  {
    id: 'mastra', label: 'Mastra Orchestration', title: 'Agent Pipeline',
    description: 'Orchestrates four specialized agents in sequence — secret detection, taint-flow vulnerability analysis, regression memory lookup, and guardrail validation — with branching logic and human-in-the-loop checkpoints.',
    leftRows: [
      { label: 'SecretDetectorAgent', marker: '~' },
      { label: 'VulnAnalyzerAgent', marker: '-' },
      { label: 'RegressionMemoryAgent → ValidationAgent', marker: '+' }
    ],
    rightIcon: <Workflow className="w-6 h-6 text-[#A1A1AA]" />
  },
  {
    id: 'qdrant', label: 'Qdrant Memory', title: 'Regression Memory',
    description: 'Every scan is embedded and stored in Qdrant. New findings are compared against historical scan vectors — if a previously-resolved issue reappears with 0.85+ similarity, Walter flags it as a regression instantly.',
    leftRows: [
      { label: 'Vector similarity search', marker: '~' },
      { label: '0.85 threshold matching', marker: '-' },
      { label: 'Cross-commit regression tracking', marker: '+' }
    ],
    rightIcon: <Database className="w-6 h-6 text-[#A1A1AA]" />
  },
  {
    id: 'enkrypt', label: 'Enkrypt AI Guardrails', title: 'Guardrail Validation',
    description: 'Every finding is validated through Enkrypt AI before reaching the report — catching hallucinated CVEs and false claims, with a fail-safe timeout so a slow check never blocks the pipeline.',
    leftRows: [
      { label: 'Hallucination detection', marker: '~' },
      { label: '/guardrails/detect endpoint', marker: '-' },
      { label: '5s fail-safe timeout', marker: '+' }
    ],
    rightIcon: <ShieldCheck className="w-6 h-6 text-[#A1A1AA]" />
  }
];

const SECTION_B_TABS: TabConfig[] = [
  {
    id: 'secret', label: 'Secret Scanning', title: 'Zero False-Positive Secrets',
    description: 'Combines entropy scoring, regex patterns, and contextual checks — a finding only surfaces when 2 of 3 signals agree, eliminating noisy false positives common in naive scanners.',
    leftRows: [
      { label: 'Entropy analysis', marker: '~' },
      { label: 'Regex pattern match', marker: '-' },
      { label: '2-of-3 quorum rule', marker: '+' }
    ],
    rightIcon: <Key className="w-6 h-6 text-[#A1A1AA]" />
  },
  {
    id: 'vuln', label: 'Vulnerability Analysis', title: 'Real Taint-Flow Analysis',
    description: 'Tracks tainted variables through function scope to their actual sink — not string matching — and cross-verifies against real GHSA advisories before reporting a CVE.',
    leftRows: [
      { label: 'AST-based taint tracking', marker: '~' },
      { label: 'Source-to-sink tracing', marker: '-' },
      { label: 'GHSA CVE verification', marker: '+' }
    ],
    rightIcon: <Bug className="w-6 h-6 text-[#A1A1AA]" />
  },
  {
    id: 'score', label: 'Scoring & Reports', title: 'Explainable Scoring',
    description: 'No floor-crash scoring — an asymptotic decay formula keeps scores meaningful at any severity level, with every finding traceable back to its exact signal breakdown.',
    leftRows: [
      { label: 'Asymptotic decay formula', marker: '~' },
      { label: 'Security + Quality dual score', marker: '-' },
      { label: 'Per-finding explainability', marker: '+' }
    ],
    rightIcon: <BarChart className="w-6 h-6 text-[#A1A1AA]" />
  }
];

export default function LandingView({ onGetStarted }: LandingViewProps) {
  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden">
      <BackgroundEffects />
      <Navbar onStartScanning={onGetStarted} />
      
      <main className="w-full flex flex-col items-center">
        {/* Main Hero Section */}
        <Hero onStartScanning={onGetStarted} />

        {/* Scroll Indicator */}
        <motion.div 
          className="flex flex-col items-center gap-2 text-[#A1A1AA] pb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mouse className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Scroll</span>
        </motion.div>

        {/* Git-Diff aesthetic sections integrated seamlessly */}
        <div className="w-full px-8 md:px-16 lg:px-24 space-y-24 pb-16 relative z-10">
          <div id="powered-by" className="w-full pt-16 -mt-16">
            <TechTabShowcase eyebrow="POWERED BY" tabs={SECTION_A_TABS} />
          </div>
        </div>

        {/* Infinite Feature Marquee */}
        <FeatureMarquee />

        <div className="w-full px-8 md:px-16 lg:px-24 space-y-24 pb-24 pt-16 relative z-10">
          <div id="features" className="w-full pt-16 -mt-16">
            <TechTabShowcase eyebrow="FEATURES" tabs={SECTION_B_TABS} />
          </div>
          
          <div id="how-it-works" className="w-full pt-16 -mt-16">
            <BentoGrid onScanNow={onGetStarted} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[rgba(255,255,255,0.08)] py-8 relative z-10 bg-[#09090B]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-semibold tracking-tight">
            <span className="text-[#7C3AED]">W</span>alter
          </div>
          <p className="text-xs text-[#A1A1AA] font-medium">
            Premium AI Security Intelligence. Powered by Mastra & Qdrant.
          </p>
          <div className="flex gap-4 text-xs font-semibold text-[#A1A1AA]">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
