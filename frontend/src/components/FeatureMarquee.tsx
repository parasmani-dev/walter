import React from 'react';
import { Shield } from 'lucide-react';

const FEATURES = [
  "Repository Scanning", "AI Vulnerability Detection", "Secret Detection", 
  "Dependency Analysis", "Security Reports", "Pull Request Review", 
  "Code Risk Analysis", "Continuous Monitoring", "Regression Detection", 
  "CVE Intelligence", "Repository Health", "Threat Detection", 
  "Secure by Design", "AI-Powered Fixes", "GitHub Native", 
  "Fast Analysis", "Enterprise Ready", "Privacy First", 
  "Developer Friendly", "Open Source Security"
];

export default function FeatureMarquee() {
  return (
    <div className="relative w-full h-[72px] bg-[#09090B] border-y border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center group mt-12 mb-12">
      {/* Subtle Scan Line Background */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.02)_50%,transparent)] bg-[length:100%_4px] animate-[scanLine_2s_linear_infinite]" />
      
      {/* Marquee Content */}
      <div className="flex whitespace-nowrap animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused] z-10">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center shrink-0">
            {FEATURES.map((feature, index) => (
              <React.Fragment key={`${i}-${index}`}>
                <div className="mx-8 flex items-center justify-center text-[rgba(255,255,255,0.88)] font-semibold text-[15px] md:text-[17px] tracking-tight cursor-pointer transition-all duration-300 ease-in-out hover:text-white hover:-translate-y-[2px] hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                  {feature}
                </div>
                <Shield className="w-3.5 h-3.5 text-[#7C3AED] opacity-65 shrink-0" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
