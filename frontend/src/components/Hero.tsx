import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import RepositoryVisualization from './RepositoryVisualization';

interface HeroProps {
  onStartScanning: () => void;
}

export default function Hero({ onStartScanning }: HeroProps) {
  const trustIndicators = [
    'Repository Security',
    'AI Vulnerability Detection',
    'Enterprise Ready',
    'Continuous Monitoring'
  ];

  return (
    <div className="relative w-full px-8 md:px-16 lg:px-24 pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col lg:flex-row items-center justify-between gap-12">
      
      {/* Left Column: Copy & Actions */}
      <div className="flex-1 flex flex-col items-start text-left space-y-8 z-10">
        
        {/* Eyebrow Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-white/5 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-wide uppercase">AI-Powered GitHub Security Intelligence</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-6xl lg:text-[5rem] font-black leading-[1.05] tracking-tight text-white"
        >
          Secure Every<br />
          <span className="text-[#7C3AED]">Repository</span><br />
          Before It Breaks
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-[#A1A1AA] max-w-[600px] leading-relaxed font-medium"
        >
          Walter continuously scans your repositories, detects security risks, explains vulnerabilities, and generates AI-powered fixes before they reach production.
        </motion.p>

        {/* Primary Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2"
        >
          <button 
            onClick={onStartScanning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#7C3AED] text-white font-bold text-[15px] px-8 py-3.5 rounded-lg transition-transform hover:scale-[1.03] hover:bg-[#6D28D9] active:scale-[0.98] shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            Start Free Scan <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent text-white font-semibold text-[15px] px-8 py-3.5 rounded-lg border border-[rgba(255,255,255,0.08)] hover:bg-white/5 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            View Demo
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 pt-6"
        >
          {trustIndicators.map((indicator, idx) => (
            <div key={indicator} className="flex items-center gap-2 text-sm font-medium text-[#A1A1AA]">
              <div className="w-4 h-4 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[#22C55E]" />
              </div>
              {indicator}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right Column: Visualization */}
      <div className="flex-1 w-full lg:w-auto z-10 flex justify-center lg:justify-end">
        <RepositoryVisualization />
      </div>
      
    </div>
  );
}
