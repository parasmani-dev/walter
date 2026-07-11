import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Folder, File, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface LiveScanViewProps {
  jobData: any;
  onBack?: () => void;
}

export default function LiveScanView({ jobData, onBack }: LiveScanViewProps) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }

    // Generate static graph data representing file imports for demo
    setGraphData({
      nodes: [
        { id: 'src/index.ts', group: 1, val: 1 },
        { id: 'src/routes/api.ts', group: 2, val: 1 },
        { id: 'src/routes/admin.ts', group: 3, val: 3 }, // Has finding
        { id: 'src/components/Auth.tsx', group: 1, val: 1 },
        { id: 'config.js', group: 3, val: 2 }, // Has finding
      ] as any,
      links: [
        { source: 'src/index.ts', target: 'src/routes/api.ts' },
        { source: 'src/index.ts', target: 'src/routes/admin.ts' },
        { source: 'src/routes/api.ts', target: 'src/components/Auth.tsx' },
        { source: 'src/routes/admin.ts', target: 'config.js' },
      ] as any
    });
  }, []);

  const progress = jobData?.progress || 0;
  const currentAgent = jobData?.currentAgent || 'SecretDetectorAgent';
  const findings = jobData?.findings || [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in relative pt-4">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute -top-10 left-0 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel Scan
        </button>
      )}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold font-mono">Live Scan in Progress</h2>
        <div className="text-[var(--color-primary-500)] font-mono animate-pulse flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> {progress}% Complete
        </div>
      </div>

      {/* Top Section: Tree & Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Live File Tree */}
        <div className="lg:col-span-1 hacker-card bg-[#0d0d0d] p-4 flex flex-col">
          <h3 className="font-mono text-xs text-gray-400 mb-4 uppercase tracking-wider">Live File Tree Analysis</h3>
          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-sm">
            <FileRow name="src" type="folder" status="pending" />
            <div className="pl-4"><FileRow name="components" type="folder" status="pending" /></div>
            <div className="pl-8"><FileRow name="Auth.tsx" type="file" status="clean" /></div>
            <div className="pl-8"><FileRow name="Dashboard.tsx" type="file" status="clean" /></div>
            <div className="pl-4"><FileRow name="routes" type="folder" status="pending" /></div>
            <div className="pl-8"><FileRow name="api.ts" type="file" status={progress > 50 ? 'clean' : 'scanning'} /></div>
            <div className="pl-8"><FileRow name="admin.ts" type="file" status={progress > 70 ? 'finding' : 'pending'} count={1} /></div>
            <FileRow name="config.js" type="file" status={progress > 30 ? 'finding' : 'pending'} count={1} />
            <FileRow name="package.json" type="file" status="pending" />
          </div>
        </div>

        {/* Force Graph */}
        <div className="lg:col-span-2 hacker-card bg-[#0d0d0d] relative overflow-hidden" ref={containerRef}>
          <div className="absolute top-4 left-4 z-10 font-mono text-xs text-gray-400 uppercase tracking-wider bg-[#0a0a0a]/80 p-1 rounded">
            Security Posture Map
          </div>
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeAutoColorBy="group"
            nodeRelSize={6}
            linkColor={() => 'rgba(255,255,255,0.2)'}
            backgroundColor="#0d0d0d"
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.id;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

              // Color logic based on findings
              if (node.id === 'src/routes/admin.ts' && progress > 70) ctx.fillStyle = '#ef4444';
              else if (node.id === 'config.js' && progress > 30) ctx.fillStyle = '#ef4444';
              else ctx.fillStyle = '#22c55e'; // Green if clean

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, node.x, node.y);
            }}
          />
        </div>
      </div>

      {/* Mandatory Tech Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Panel 1: Mastra */}
        <div className="lg:col-span-1 hacker-card p-4 flex flex-col relative">
          <div className="font-mono text-xs text-gray-500 mb-4 uppercase tracking-wider">Mastra Orchestration Layer</div>
          <div className="flex flex-col gap-2 flex-1">
            <AgentBox name="SecretDetectorAgent" active={currentAgent === 'SecretDetectorAgent'} done={progress > 25} />
            <AgentBox name="VulnAnalyzerAgent" active={currentAgent === 'VulnAnalyzerAgent'} done={progress > 50} />
            <AgentBox name="RegressionMemoryAgent" active={currentAgent === 'RegressionMemoryAgent'} done={progress > 75} />
            <AgentBox name="ValidationAgent" active={currentAgent === 'ValidationAgent'} done={progress >= 100} />
          </div>
        </div>

        {/* Panel 2: Qdrant (Highlighted, wider) */}
        <div className="lg:col-span-2 hacker-card border-[var(--color-primary-500)] shadow-[0_0_15px_rgba(232,179,58,0.1)] p-4 relative overflow-hidden bg-[#1a1505]">
          <div className="font-mono text-xs text-[var(--color-primary-500)] mb-4 uppercase tracking-wider font-bold">
            Qdrant Vector Memory — threshold 0.85
          </div>
          <div className="flex items-center justify-center h-full relative px-8">
            {/* Timeline Line */}
            <div className="absolute left-8 right-8 h-0.5 bg-[#404040] top-1/2 -translate-y-1/2"></div>
            
            {/* Timeline Dots */}
            <div className="flex justify-between w-full relative z-10">
              <CommitDot sha="a3f2c1" status="clean" />
              <CommitDot sha="b7e9d4" status="new" />
              <CommitDot sha="c1a8f2" status="clean" />
              <CommitDot sha="9b4e2f" status="regression" active={progress > 75} />
            </div>
          </div>
        </div>

        {/* Panel 3: Enkrypt Guardrails */}
        <div className="lg:col-span-1 hacker-card p-4 flex flex-col relative overflow-hidden">
          <div className="font-mono text-xs text-gray-500 mb-4 uppercase tracking-wider flex justify-between items-center">
            <span>Enkrypt AI Guardrails</span>
            <span className="text-[10px] bg-[#262626] px-1 rounded">/guardrails/detect</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 font-mono text-xs">
            {progress > 30 && (
              <div className="flex justify-between items-center text-gray-300 animate-slide-up">
                <span>config.js:12</span>
                <span className="badge-chip bg-green-900/40 text-green-400">PASS</span>
              </div>
            )}
            {progress > 70 && (
              <div className="flex justify-between items-center text-gray-300 animate-slide-up" style={{animationDelay: '100ms'}}>
                <span>admin.ts:7</span>
                <span className="badge-chip bg-green-900/40 text-green-400">PASS</span>
              </div>
            )}
            {progress > 50 && progress < 100 && (
              <div className="flex items-center gap-2 text-gray-500 mt-auto pt-2 border-t border-[#262626]">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Validating findings... (5s timeout)</span>
              </div>
            )}
            {progress >= 100 && (
              <div className="flex items-center gap-2 text-[var(--color-primary-500)] mt-auto pt-2 border-t border-[#262626]">
                <CheckCircle className="w-3 h-3" />
                <span>All findings validated</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function FileRow({ name, type, status, count }: any) {
  let icon = type === 'folder' ? <Folder className="w-4 h-4 text-blue-400" /> : <File className="w-4 h-4 text-gray-400" />;
  
  let statusIndicator = null;
  let textColor = "text-gray-400";

  if (status === 'scanning') {
    statusIndicator = <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse ml-auto" />;
    textColor = "text-yellow-200";
  } else if (status === 'clean') {
    statusIndicator = <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />;
  } else if (status === 'finding') {
    statusIndicator = <span className="ml-auto badge-chip bg-red-900/50 text-red-400 border border-red-900">{count}</span>;
    textColor = "text-red-300";
  }

  return (
    <div className={`flex items-center gap-2 py-1 ${textColor}`}>
      {icon}
      <span>{name}</span>
      {statusIndicator}
    </div>
  );
}

function AgentBox({ name, active, done }: any) {
  let bgClass = "bg-[#141414] border-[#262626] text-gray-500";
  if (active) bgClass = "bg-[var(--color-primary-500)] text-black border-[var(--color-primary-500)] shadow-[0_0_10px_rgba(232,179,58,0.5)]";
  if (done && !active) bgClass = "bg-green-900/20 text-green-500 border-green-900/50";

  return (
    <div className={`p-2 border rounded text-xs font-mono transition-all duration-300 flex items-center justify-between ${bgClass}`}>
      {name}
      {done && !active && <CheckCircle className="w-3 h-3" />}
    </div>
  );
}

function CommitDot({ sha, status, active }: any) {
  let color = "bg-green-500"; // clean
  if (status === 'new') color = "bg-red-500";
  if (status === 'regression') color = "bg-[var(--color-status-regression)]";
  
  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <div className={`w-4 h-4 rounded-full border-2 border-black z-10 transition-transform ${color} ${active ? 'scale-150 animate-pulse' : ''}`} />
      <span className="font-mono text-[10px] text-gray-500">{sha}</span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-[#0a0a0a] border border-[#262626] p-2 rounded text-xs text-white z-20">
        Commit: {sha} <br/>
        Status: <span className="uppercase">{status}</span>
      </div>
    </div>
  );
}
