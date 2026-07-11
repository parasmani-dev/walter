import React, { useState, useEffect } from 'react';

export interface TabConfig {
  id: string;
  label: string;
  title: string;
  description: string;
  leftRows: { label: string; marker: '+' | '-' | '~' }[];
  rightIcon: React.ReactNode;
}

interface TechTabShowcaseProps {
  eyebrow: string;
  tabs: TabConfig[];
}

export default function TechTabShowcase({ eyebrow, tabs }: TechTabShowcaseProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % tabs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tabs.length, isHovered]);

  const activeTab = tabs[activeIdx];

  const getMarkerClass = (marker: '+' | '-' | '~') => {
    switch (marker) {
      case '+': return 'diff-add';
      case '-': return 'diff-remove';
      case '~': return 'diff-modify';
      default: return '';
    }
  };

  return (
    <div 
      className="w-full text-left my-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-4 mb-8">
        <span className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-widest">{eyebrow}</span>
        
        {/* Tab Pill Bar */}
        <div className="flex items-center gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-full self-start border border-[rgba(255,255,255,0.08)]">
          {tabs.map((tab, idx) => (
            <div 
              key={tab.id}
              onClick={() => setActiveIdx(idx)}
              className={`tab-pill text-sm ${idx === activeIdx ? 'tab-pill-active' : 'hover:text-white'}`}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area (Two Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[220px]">
        {/* Left Column */}
        <div key={`left-${activeTab.id}`} className="animate-fade-in flex flex-col justify-center">
          <h3 className="text-3xl font-extrabold text-white mb-2">{activeTab.title}</h3>
          
          <div className="hacker-card mt-6 p-0 border border-[rgba(255,255,255,0.08)] rounded-lg bg-transparent">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-white/5 backdrop-blur-sm">
              <span className="text-[#7C3AED] font-bold text-sm uppercase">{activeTab.label}</span>
              <span className="text-[#A1A1AA] font-mono text-xs">{activeTab.title}</span>
            </div>
            <div className="p-4 space-y-3 font-mono text-sm text-gray-300">
              {activeTab.leftRows.map((row, i) => (
                <div key={i} className="flex items-center">
                  <span className={`diff-marker ${getMarkerClass(row.marker)}`}>{row.marker}</span>
                  {row.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div key={`right-${activeTab.id}`} className="animate-fade-in flex flex-col justify-center">
          <div className="hacker-card p-6 border border-[rgba(255,255,255,0.08)] rounded-lg bg-transparent h-full flex flex-col">
            <div className="flex-1 space-y-6 pr-0 lg:pr-12">
          {eyebrow && (
            <div className="text-xs font-bold tracking-widest text-[#A1A1AA] mb-4">
              {eyebrow}
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/5 backdrop-blur-sm rounded border border-[rgba(255,255,255,0.08)]">
              {activeTab.rightIcon}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              {activeTab.title}
            </h2>
          </div>
          
          <p className="text-lg text-[#A1A1AA] leading-relaxed max-w-2xl">
            {activeTab.description}
          </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
