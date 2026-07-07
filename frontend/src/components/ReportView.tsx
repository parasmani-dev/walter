import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ReportViewProps {
  report: any;
}

function getVerdictColor(verdict: string) {
  if (verdict === 'PASS') return 'text-[var(--color-status-resolved)] border-[var(--color-status-resolved)]';
  if (verdict === 'FAIL') return 'text-[var(--color-status-critical)] border-[var(--color-status-critical)]';
  if (verdict === 'REGENERATED') return 'text-[var(--color-status-new)] border-[var(--color-status-new)]';
  return 'text-[var(--color-text-body)] border-[var(--color-border-dark)]';
}

function getSeverityColor(severity: string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'text-[var(--color-status-critical)]';
    case 'HIGH': return 'text-[var(--color-status-high)]';
    case 'MEDIUM': return 'text-[var(--color-status-new)]';
    case 'LOW': return 'text-[var(--color-status-resolved)]';
    default: return 'text-[var(--color-status-persistent)]';
  }
}

function getClassificationBadge(classification: string) {
  switch (classification) {
    case 'NEW':
      return <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[var(--color-status-new)] text-black rounded-sm">NEW</span>;
    case 'RESOLVED':
      return <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[var(--color-status-resolved)] text-black rounded-sm">RESOLVED</span>;
    case 'PERSISTENT':
      return <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[var(--color-status-persistent)] text-white rounded-sm">PERSISTENT</span>;
    default: return null;
  }
}

export function ReportView({ report }: ReportViewProps) {
  const { jsonReport } = report;
  const { securityScore, letterGrade, validationVerdicts, findingsSummary, findings } = jsonReport;

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (idx: number) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setExpandedItems(newSet);
  };

  // Group findings
  const secrets = findings.filter((f: any) => !f.finding.findingType || f.finding.findingType === 'SECRET');
  const vulns = findings.filter((f: any) => f.finding.findingType === 'TAINT_FLOW' || f.finding.findingType === 'DEPENDENCY_CVE');

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-8 pb-16">
      
      {/* Hero Score Card */}
      <div className="hacker-card p-10 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-2 opacity-50">
          <Activity className="w-5 h-5" />
          <span className="font-mono text-sm uppercase">Threat_Posture</span>
        </div>
        
        <div className="relative w-48 h-48 mt-4 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="var(--color-border-dark)" strokeWidth="8" fill="none" />
            <circle 
              cx="96" cy="96" r="88" 
              stroke="var(--color-status-resolved)" 
              strokeWidth="8" 
              fill="none" 
              strokeDasharray="552" 
              strokeDashoffset={552 - (552 * securityScore) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center z-10">
            <div className="text-6xl font-mono font-bold text-white">{securityScore}</div>
            <div className="text-xl font-mono font-bold text-[var(--color-status-resolved)] mt-1">GRADE {letterGrade}</div>
          </div>
        </div>

        <div className="flex gap-8 mt-10 w-full justify-center text-center font-mono text-sm">
          <div><div className="text-[var(--color-status-critical)] text-xl font-bold">{findingsSummary.newRegressions}</div><div className="opacity-70 mt-1">NEW</div></div>
          <div><div className="text-[var(--color-status-resolved)] text-xl font-bold">{findingsSummary.resolvedRegressions}</div><div className="opacity-70 mt-1">RESOLVED</div></div>
          <div><div className="text-[var(--color-status-persistent)] text-xl font-bold">{findingsSummary.persistentFindings}</div><div className="opacity-70 mt-1">PERSISTENT</div></div>
        </div>
      </div>

      {/* Enkrypt Guardrails */}
      <div>
        <h3 className="font-mono text-sm text-[var(--color-text-body)] mb-4 uppercase tracking-widest flex items-center gap-2">
          <Brain className="w-4 h-4" /> Enkrypt_AI_Guardrails
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {validationVerdicts?.filter((v:any) => v.checkType.startsWith('ENKRYPT_')).map((v: any, idx: number) => (
            <div key={idx} className={`hacker-card p-4 border-l-4 ${getVerdictColor(v.verdict)}`}>
              <div className="font-mono text-xs opacity-70 mb-1">{v.checkType.replace('ENKRYPT_', '')}</div>
              <div className="font-mono font-bold text-lg mb-2">{v.verdict}</div>
              <div className="text-sm opacity-80">{v.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vulnerabilities */}
      {vulns.length > 0 && (
        <div>
          <h3 className="font-mono text-sm text-[var(--color-text-body)] mb-4 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--color-status-critical)]" /> Identified_Vulnerabilities
          </h3>
          <div className="space-y-3">
            {vulns.map((f: any, idx: number) => {
              const isExpanded = expandedItems.has(`vuln-${idx}` as any);
              return (
              <div key={`vuln-${idx}`} className="hacker-card flex flex-col cursor-pointer hover:border-gray-500 transition-colors" onClick={() => toggleItem(`vuln-${idx}` as any)}>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50"/> : <ChevronRight className="w-4 h-4 opacity-50"/>}
                      {getClassificationBadge(f.classification)}
                      <span className="font-mono font-bold text-white">{f.finding.findingType}</span>
                    </div>
                    <span className={`font-mono text-sm font-bold ${getSeverityColor(f.finding.severity)}`}>
                      {f.finding.severity}
                    </span>
                  </div>
                  {f.finding.owaspCategory && <div className="text-sm opacity-80 ml-7">{f.finding.owaspCategory}</div>}
                  <div className="font-mono text-xs opacity-60 mt-2 ml-7">
                    {f.finding.filePath && `> ${f.finding.filePath}:${f.finding.lineNumber}`}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 ml-7 font-mono text-xs space-y-2 opacity-80">
                    {f.finding.source && <div><span className="text-[var(--color-status-resolved)]">Source:</span> {f.finding.source}</div>}
                    {f.finding.sink && <div><span className="text-[var(--color-status-critical)]">Sink:</span> {f.finding.sink}</div>}
                    {f.finding.snippetHash && (
                      <div className="mt-2 p-2 bg-[var(--color-bg-dark)] border border-[var(--color-border-dark)] rounded-sm overflow-x-auto">
                        <code>{f.finding.snippetHash}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Secrets */}
      {secrets.length > 0 && (
        <div>
          <h3 className="font-mono text-sm text-[var(--color-text-body)] mb-4 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--color-status-high)]" /> Hardcoded_Secrets
          </h3>
          <div className="space-y-3">
            {secrets.map((f: any, idx: number) => {
              const isExpanded = expandedItems.has(`sec-${idx}` as any);
              return (
              <div key={`sec-${idx}`} className="hacker-card flex flex-col cursor-pointer hover:border-gray-500 transition-colors" onClick={() => toggleItem(`sec-${idx}` as any)}>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-4 h-4 opacity-50"/> : <ChevronRight className="w-4 h-4 opacity-50"/>}
                      {getClassificationBadge(f.classification)}
                      <span className="font-mono font-bold text-white">{f.finding.patternType || "SECRET"}</span>
                    </div>
                    <span className={`font-mono text-sm font-bold ${getSeverityColor(f.finding.confidence)}`}>
                      {f.finding.confidence}
                    </span>
                  </div>
                  <div className="font-mono text-xs opacity-60 mt-2 ml-7">
                    {f.finding.filePath && `> ${f.finding.filePath}:${f.finding.lineNumber}`}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 ml-7 font-mono text-xs space-y-2 opacity-80">
                    <div className="text-[var(--color-status-high)]">Masked Secret Match:</div>
                    <div className="p-2 bg-[var(--color-bg-dark)] border border-[var(--color-border-dark)] rounded-sm overflow-x-auto">
                      <code>{f.finding.maskedSecret}</code>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      )}

    </div>
  );
}
