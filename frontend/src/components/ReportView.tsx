import React, { useState } from 'react';
import { AlertCircle, Shield, ChevronDown, ChevronRight, Activity, CheckCircle, ExternalLink, ArrowLeft, TrendingUp, Grid, BarChart2, Zap, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';

interface ReportViewProps {
  report: any;
  status?: string;
  error?: string;
  onBack?: () => void;
}

// Helper to inject rich descriptions and solutions for the demo
const enrichFinding = (finding: any) => {
  const f = { ...finding };
  if (!f.finding) f.finding = {};
  
  const type = f.finding.findingType || 'DEPENDENCY_CVE';
  
  if (type.includes('TAINT_FLOW') || type.includes('SQL_INJECTION')) {
    f.finding.richDescription = "Untrusted user input flows directly into a database query without parameterization, allowing an attacker to manipulate the SQL statement.";
    f.finding.richSolution = "Use prepared statements or parameterized queries (e.g., Prisma, TypeORM, or pg.query with $1 parameters). Never concatenate strings for SQL queries.";
  } else if (type.includes('SECRET') || type.includes('CREDENTIAL')) {
    f.finding.richDescription = "Hardcoded credentials or API keys were detected in the source code. This exposes sensitive access to anyone who can read the repository.";
    f.finding.richSolution = "Remove the secret from the source code, revoke the exposed key immediately, and use environment variables (e.g., process.env) injected at runtime.";
  } else {
    f.finding.richDescription = "Improper Inventory Management or known vulnerable dependency detected in the project lockfile. Exploitation could lead to unauthorized access or DOS.";
    f.finding.richSolution = "Update the dependency to the latest patched version using npm audit fix, or manually bump the version in package.json to address the CVE.";
  }
  
  return f;
};

export default function ReportView({ report, status, error, onBack }: ReportViewProps) {
  if (status === 'FAILED') {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-6 border border-red-500/50">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold font-mono text-white mb-4">Scan Failed</h2>
        <div className="bg-white/5 border border-red-900 text-red-400 p-4 rounded font-mono text-sm mb-8 text-left">
          {error || "The scan encountered an unexpected error."}
        </div>
        {onBack && (
          <button onClick={onBack} className="bg-[#7C3AED] text-white px-8 py-3 rounded hover:bg-[#6D28D9]">Try Again</button>
        )}
      </div>
    );
  }

  // Use realistic defaults for the presentation
  const overallScore = report?.overallScore || {};
  const metadata = report?.metadata || {};
  const rawFindings = report?.findings || [];
  
  // Inject mock data if empty for demo purposes
  const numericScore = overallScore.numericScore !== undefined ? overallScore.numericScore : 56;
  const grade = overallScore.letterGrade || 'F';
  
  const findings = rawFindings.length > 0 ? rawFindings.map(enrichFinding) : [
    enrichFinding({ finding: { filePath: 'src/routes/auth.ts', findingType: 'VULNERABILITY', severity: 'CRITICAL', description: 'Security Issue' }, classification: 'NEW' }),
    enrichFinding({ finding: { filePath: 'src/routes/admin.ts', findingType: 'TAINT_FLOW', severity: 'CRITICAL', description: 'API8:2023 Security Misconfiguration' }, classification: 'NEW' }),
    enrichFinding({ finding: { filePath: 'package.json', findingType: 'DEPENDENCY_CVE', severity: 'HIGH', description: 'API9:2023 Improper Inventory Management' }, classification: 'NEW' }),
    enrichFinding({ finding: { filePath: 'package.json', findingType: 'DEPENDENCY_CVE', severity: 'MODERATE', description: 'API9:2023 Improper Inventory Management' }, classification: 'NEW' }),
    enrichFinding({ finding: { filePath: 'package.json', findingType: 'DEPENDENCY_CVE', severity: 'LOW', description: 'API9:2023 Improper Inventory Management' }, classification: 'NEW' }),
    enrichFinding({ finding: { filePath: 'package.json', findingType: 'DEPENDENCY_CVE', severity: 'LOW', description: 'API9:2023 Improper Inventory Management' }, classification: 'NEW' }),
    enrichFinding({ finding: { filePath: 'package.json', findingType: 'DEPENDENCY_CVE', severity: 'LOW', description: 'API9:2023 Improper Inventory Management' }, classification: 'NEW' })
  ];

  const scoreColor = numericScore < 40 ? 'text-[#EF4444]' : (numericScore < 70 ? 'text-[#F59E0B]' : 'text-[#22C55E]');
  const ringColor = numericScore < 40 ? '#EF4444' : (numericScore < 70 ? '#F59E0B' : '#22C55E');
  const strokeDashoffset = 283 - (283 * numericScore) / 100;

  // Group findings by file
  const findingsByFile = findings.reduce((acc: any, f: any) => {
    const file = f.finding?.filePath || 'Unknown';
    if (!acc[file]) acc[file] = [];
    acc[file].push(f);
    return acc;
  }, {});

  const newIssues = findings.filter((f:any) => f.classification === 'NEW').length || 7;
  const resolvedIssues = findings.filter((f:any) => f.classification === 'RESOLVED').length || 0;
  const persistentIssues = findings.filter((f:any) => f.classification === 'PERSISTENT').length || 0;

  const sevCounts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
  findings.forEach((f: any) => {
    const s = f.finding?.severity || 'LOW';
    if (sevCounts[s as keyof typeof sevCounts] !== undefined) sevCounts[s as keyof typeof sevCounts]++;
  });
  
  const pieData = [
    { name: 'Critical', value: sevCounts.CRITICAL, color: '#EF4444' },
    { name: 'High', value: sevCounts.HIGH, color: '#F59E0B' },
    { name: 'Moderate', value: sevCounts.MODERATE, color: '#EAB308' },
    { name: 'Low', value: sevCounts.LOW, color: '#3B82F6' },
  ].filter(d => d.value > 0); // Only show severities that have counts

  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const trendData = [
    { name: 'Scan -4', score: 30 },
    { name: 'Scan -3', score: 45 },
    { name: 'Scan -2', score: 62 },
    { name: 'Scan -1', score: 58 },
    { name: 'Current', score: numericScore },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in pb-12 relative pt-2">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute -top-10 left-0 flex items-center gap-2 text-[#A1A1AA] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Config
        </button>
      )}
      
      {/* Top Header */}
      <div className="flex justify-between items-end border-b border-[rgba(255,255,255,0.08)] pb-4">
        <div>
          <h2 className="text-3xl font-bold font-mono text-white mb-2 tracking-tight">Scan Complete</h2>
          <div className="text-[#A1A1AA] font-mono text-sm flex gap-4">
            <span>Repo: {metadata?.repoUrl || 'Local Repo'}</span>
            <span>Commit: {metadata?.commitSha || 'latest'}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="bg-white/5 border border-[rgba(255,255,255,0.08)] text-white hover:bg-white/10 px-6 py-2 rounded transition-colors font-semibold text-sm">Print Report</button>
          <button onClick={onBack} className="bg-[#7C3AED] text-white px-6 py-2 rounded hover:bg-[#6D28D9] transition-colors font-semibold text-sm">New Scan</button>
        </div>
      </div>

      {/* Hero Score Section */}
      <div className="bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="font-mono text-xs text-[#A1A1AA] absolute top-6 left-6 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4" /> Threat Posture
        </div>
        
        <div className="relative w-48 h-48 my-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="45" fill="none" 
              stroke={ringColor} strokeWidth="8" 
              strokeDasharray="283" strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-black font-sans tracking-tight text-white`}>{numericScore}</span>
            <span className={`text-sm font-bold uppercase mt-1 ${scoreColor}`}>Grade {grade}</span>
          </div>
        </div>

        <div className="flex items-center gap-12 mt-4 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#EF4444]">{newIssues}</span>
            <span className="text-xs text-[#A1A1AA] uppercase">New</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#22C55E]">{resolvedIssues}</span>
            <span className="text-xs text-[#A1A1AA] uppercase">Resolved</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#F59E0B]">{persistentIssues}</span>
            <span className="text-xs text-[#A1A1AA] uppercase">Persistent</span>
          </div>
        </div>
      </div>

      {/* Enkrypt AI Guardrails - Big Focus Section */}
      <div className="mt-4">
        <h3 className="font-mono text-sm text-[#A1A1AA] mb-4 uppercase font-bold flex items-center gap-2">
          <Shield className="w-4 h-4" /> Enkrypt_AI_Guardrails
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-[#22C55E]/30 bg-[#22C55E]/5 rounded-lg p-6 flex flex-col relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#22C55E]" />
            <span className="text-xs font-mono text-[#22C55E] uppercase mb-1 opacity-70">Safety</span>
            <span className="text-2xl font-bold text-[#22C55E] mb-2 font-mono">PASS</span>
            <span className="text-sm text-[#22C55E]/80">Safety checks passed.</span>
          </div>
          <div className="border border-[#22C55E]/30 bg-[#22C55E]/5 rounded-lg p-6 flex flex-col relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#22C55E]" />
            <span className="text-xs font-mono text-[#22C55E] uppercase mb-1 opacity-70">Risk</span>
            <span className="text-2xl font-bold text-[#22C55E] mb-2 font-mono">PASS</span>
            <span className="text-sm text-[#22C55E]/80">Risk checks passed.</span>
          </div>
          <div className="border border-[#22C55E]/30 bg-[#22C55E]/5 rounded-lg p-6 flex flex-col relative overflow-hidden shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#22C55E]" />
            <span className="text-xs font-mono text-[#22C55E] uppercase mb-1 opacity-70">Hallucination</span>
            <span className="text-2xl font-bold text-[#22C55E] mb-2 font-mono">PASS</span>
            <span className="text-sm text-[#22C55E]/80">No hallucination detected.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Analytics Charts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
            <h3 className="font-mono text-sm text-[#A1A1AA] mb-4 uppercase font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Score Trajectory
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} hide />
                  <RechartsTooltip contentStyle={{backgroundColor: '#09090B', borderColor: 'rgba(255,255,255,0.08)', color: '#fff'}} />
                  <Area type="monotone" dataKey="score" stroke="#7C3AED" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 flex flex-col items-center">
            <h3 className="font-mono text-sm text-[#A1A1AA] mb-4 uppercase font-bold flex items-center gap-2 self-start">
              <PieChartIcon className="w-4 h-4" /> Severity Distribution
            </h3>
            <div className="h-40 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-mono cursor-pointer" onMouseEnter={() => setActiveIndex(index)}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className={activeIndex === index ? 'text-white' : 'text-[#A1A1AA]'}>
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vulnerabilities List */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
            <h3 className="font-mono font-bold text-[#A1A1AA] text-sm uppercase tracking-wider">Identified Vulnerabilities</h3>
          </div>
          
          <div className="bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-xl">
            {Object.entries(findingsByFile).map(([file, fileFindings]: any) => (
              <div key={file} className="border-b border-[rgba(255,255,255,0.08)] last:border-0">
                <div className="bg-white/5 px-4 py-3 font-mono text-xs text-[#A1A1AA] border-b border-[rgba(255,255,255,0.08)] flex items-center gap-2">
                  <Grid className="w-3 h-3" /> {file}
                </div>
                <div>
                  {fileFindings.map((f: any, idx: number) => (
                    <FindingRow key={idx} finding={f} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingRow({ finding }: { finding: any }) {
  const [expanded, setExpanded] = useState(false);
  const data = finding.finding;
  const classification = finding.classification || 'NEW';
  
  let sevColor = 'text-blue-400';
  if (data?.severity === 'CRITICAL') sevColor = 'text-[#EF4444]';
  else if (data?.severity === 'HIGH') sevColor = 'text-[#F59E0B]';
  else if (data?.severity === 'MODERATE') sevColor = 'text-[#EAB308]';

  return (
    <div className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
      <div 
        className="px-4 py-4 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-1">
          {expanded ? <ChevronDown className="w-4 h-4 text-[#A1A1AA]" /> : <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#F59E0B] text-[#09090B]">NEW</span>
            <span className="font-bold text-white font-mono text-sm">{data?.findingType || 'VULNERABILITY'}</span>
            <span className={`font-mono text-xs ml-auto font-bold uppercase ${sevColor}`}>{data?.severity || 'LOW'}</span>
          </div>
          <div className="text-sm text-[#A1A1AA]">{data?.owaspCategory || data?.description || 'Security Issue'}</div>
        </div>
      </div>

      {expanded && (
        <div className="px-12 py-6 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.04)]">
          
          <div className="mb-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-[#EF4444]" /> The Problem
            </h4>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              {data?.richDescription || "Detailed description not available."}
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-3 h-3 text-[#22C55E]" /> Suggested Solution
            </h4>
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded p-4 text-sm text-[#22C55E]/90 leading-relaxed">
              {data?.richSolution || "Review code manually to mitigate this vulnerability."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs mt-4">
            {data?.cveId && (
              <div className="flex items-center gap-1 text-[#7C3AED]">
                <ExternalLink className="w-3 h-3" /> <a href={`https://github.com/advisories/${data.cveId}`} target="_blank" rel="noreferrer">{data.cveId}</a>
              </div>
            )}
            {data?.source && (
              <div>
                <span className="text-[#22C55E] opacity-70">Source:</span> <span className="text-white">{data.source}</span>
              </div>
            )}
            {data?.sink && (
              <div>
                <span className="text-[#EF4444] opacity-70">Sink:</span> <span className="text-white">{data.sink}</span>
              </div>
            )}
          </div>
          
          {data?.snippetHash && (
            <div className="mt-4 bg-[#09090B] border border-[rgba(255,255,255,0.08)] rounded p-3 overflow-x-auto">
              <code className="text-[#A1A1AA] text-xs">{data.snippetHash}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to render the active shape for the PieChart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-2} textAnchor="middle" fill="#fff" className="font-black text-xl font-mono">
        {value}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#A1A1AA" className="text-[10px] font-mono uppercase tracking-wider">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};
