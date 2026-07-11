import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Zap, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RepositoryVisualization() {
  const [step, setStep] = useState(0);

  // Simple animation sequence for the terminal
  useEffect(() => {
    const timer = setInterval(() => {
      setStep(s => (s < 9 ? s + 1 : s));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      
      {/* Terminal Window */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl relative"
      >
        {/* Terminal Header */}
        <div className="px-4 py-3 border-b border-[#262626] flex items-center justify-between bg-[#141414]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
            <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
          </div>
          <div className="font-mono text-xs text-[#A1A1AA] flex items-center gap-2">
            <Terminal className="w-3 h-3" /> terminal - walter
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-mono bg-red-900/30 text-red-500 px-2 py-0.5 rounded border border-red-900/50">2 critical</span>
            <span className="text-[10px] font-mono bg-orange-900/30 text-orange-500 px-2 py-0.5 rounded border border-orange-900/50">2 high</span>
            <span className="text-[10px] font-mono bg-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded border border-[#7C3AED]/30">ai ready</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 font-mono text-sm leading-relaxed space-y-2 h-[320px]">
          <div className="text-white">
            <span className="text-[#22C55E]">$</span> walter scan github.com/user/my-app
          </div>
          
          {step >= 1 && (
            <div className="text-[#A1A1AA]">
              <span className="text-gray-600">{'>'}</span> Fetching repo tree... 42 files found
            </div>
          )}
          
          {step >= 2 && (
            <div className="text-[#A1A1AA]">
              <span className="text-gray-600">{'>'}</span> Running secret scanner...
            </div>
          )}
          
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[#EF4444] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>CRITICAL config.js:12 — AWS key exposed</span>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[#EF4444] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>CRITICAL .env.local:3 — MongoDB URI exposed</span>
            </motion.div>
          )}

          {step >= 5 && (
            <div className="text-[#A1A1AA] pt-2">
              <span className="text-gray-600">{'>'}</span> Running AI review on api/auth.js...
            </div>
          )}

          {step >= 6 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[#F59E0B] flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 shrink-0" />
              <span>HIGH line 34 — no error handling on async fetch</span>
            </motion.div>
          )}

          {step >= 7 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[#EAB308] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>MED line 67 — raw password comparison (use bcrypt)</span>
            </motion.div>
          )}

          {step >= 8 && (
            <div className="text-[#A1A1AA] pt-4">
              <span className="text-gray-600">{'>'}</span> Security score: <span className="text-[#EF4444]">38/100</span> · Quality: <span className="text-[#22C55E]">71/100</span>
            </div>
          )}

          {step >= 9 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#22C55E] flex items-center gap-2 pt-1">
              <CheckCircle className="w-4 h-4" />
              <span>Full report ready — <span className="text-white underline cursor-pointer hover:text-[#7C3AED] transition-colors">view dashboard</span></span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats Footer */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="grid grid-cols-4 w-full gap-4 mt-12 pt-8 border-t border-[rgba(255,255,255,0.05)]"
      >
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-2xl font-bold text-white">20+</span>
          <span className="text-[10px] text-[#A1A1AA] font-mono uppercase tracking-widest">Secret Patterns</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-2xl font-bold text-white">~2s</span>
          <span className="text-[10px] text-[#A1A1AA] font-mono uppercase tracking-widest">Avg Scan Time</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-2xl font-bold text-white">100%</span>
          <span className="text-[10px] text-[#A1A1AA] font-mono uppercase tracking-widest">Free to Use</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-2xl font-bold text-white">AI</span>
          <span className="text-[10px] text-[#A1A1AA] font-mono uppercase tracking-widest">Gemini Powered</span>
        </div>
      </motion.div>

    </div>
  );
}
