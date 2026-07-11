import React from 'react';
import { Link, Search, AlertTriangle, ShieldCheck, Activity, Scan, Zap, CheckCircle } from 'lucide-react';

interface BentoGridProps {
  onScanNow: () => void;
}

export default function BentoGrid({ onScanNow }: BentoGridProps) {
  return (
    <div className="w-full text-left my-12">
      <span className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-widest mb-2 block">
        HOW IT WORKS
      </span>
      <h3 className="text-4xl font-extrabold text-white mb-8 tracking-tight">How Walter Works</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div className="lg:col-span-2 bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-[rgba(255,255,255,0.15)] transition-colors overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
            <Scan className="w-48 h-48 text-[#7C3AED]" />
          </div>
          <div className="relative z-10 max-w-lg mb-8 md:mb-0">
            <h3 className="text-3xl font-bold text-white tracking-tight mb-4">Zero-Config Setup</h3>
            <p className="text-lg text-[#A1A1AA] leading-relaxed">No YAML pipelines or Docker containers required. Just paste your repository URL and Walter handles the rest natively.</p>
          </div>
            
          {/* The Scan Button - Clean, Non-overlapping */}
          <div className="relative z-10 hacker-card p-5 border border-[rgba(255,255,255,0.08)] bg-white/5 min-w-[280px] backdrop-blur-md rounded-xl">
            <div className="font-mono text-xs text-[#A1A1AA] mb-4 flex items-center">
              <span className="animate-pulse mr-2 text-[#7C3AED]">▶</span>
              Agents active: Mastra · Qdrant
            </div>
            <button 
              onClick={onScanNow}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3 text-sm rounded transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Scan Now
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="lg:col-span-1 bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 flex flex-col justify-between group hover:border-[rgba(255,255,255,0.15)] transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Real-Time Speed</h3>
            <p className="text-base text-[#A1A1AA]">Leveraging parallel execution, average scans complete in under 5 seconds.</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="lg:col-span-1 bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 flex flex-col justify-between group hover:border-[rgba(255,255,255,0.15)] transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#22C55E]/20 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Auto Fixes</h3>
            <p className="text-base text-[#A1A1AA]">Don't just find bugs. Walter generates production-ready patches for you.</p>
          </div>
        </div>

        {/* Card 4 (Large Data) */}
        <div className="lg:col-span-2 bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 flex flex-col justify-between group hover:border-[rgba(255,255,255,0.15)] transition-colors relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <h3 className="text-3xl font-bold text-white tracking-tight">Enterprise Scale</h3>
            <p className="text-lg text-[#A1A1AA] max-w-md leading-relaxed">Built to handle monolithic repositories with thousands of commits effortlessly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
