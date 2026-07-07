import React from 'react';
import { Check, CircleDot, Circle } from 'lucide-react';

const STAGES = [
  { id: 'clone', label: 'Cloning and scanning repository' },
  { id: 'secrets', label: 'Detecting secrets' },
  { id: 'vulns', label: 'Analyzing vulnerabilities' },
  { id: 'regression', label: 'Comparing against prior regressions' },
  { id: 'synth', label: 'Synthesizing and validating report' },
  { id: 'done', label: 'Done' }
];

interface ProgressIndicatorProps {
  currentProgress?: string;
  status: string;
}

export function ProgressIndicator({ currentProgress, status }: ProgressIndicatorProps) {
  // Find current stage index based on progress string match, default to 0
  let currentIndex = STAGES.findIndex(s => s.label === currentProgress);
  if (currentIndex === -1) currentIndex = 0;
  if (status === 'COMPLETED') currentIndex = STAGES.length;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 hacker-card p-8">
      <h3 className="font-mono text-sm text-[var(--color-text-body)] mb-8 uppercase tracking-widest opacity-70">
        Execution_Trace
      </h3>
      <div className="relative">
        {/* Vertical line connecting nodes */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[var(--color-border-dark)]" />
        
        <div className="space-y-6">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex || status === 'COMPLETED';
            const isCurrent = idx === currentIndex && status !== 'COMPLETED' && status !== 'FAILED';
            const isPending = idx > currentIndex && status !== 'FAILED';
            
            let Icon = Circle;
            let iconColor = 'text-[var(--color-border-dark)]';
            let textColor = 'text-[var(--color-border-dark)]';

            if (isCompleted) {
              Icon = Check;
              iconColor = 'text-[var(--color-status-resolved)]';
              textColor = 'text-white opacity-80';
            } else if (isCurrent) {
              Icon = CircleDot;
              iconColor = 'text-[var(--color-status-new)]';
              textColor = 'text-white font-bold';
            }

            if (status === 'FAILED' && idx === currentIndex) {
              iconColor = 'text-[var(--color-status-critical)]';
              textColor = 'text-[var(--color-status-critical)]';
            }

            return (
              <div key={stage.id} className="relative flex items-center gap-4 z-10">
                <div className={`bg-[var(--color-bg-card)] rounded-full ${iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`font-mono text-sm ${textColor}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
