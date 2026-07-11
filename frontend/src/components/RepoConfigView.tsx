import React, { useState } from 'react';
import { Search, Folder, File, ChevronRight, Package, Bot, RotateCcw, Settings, ArrowLeft } from 'lucide-react';

interface RepoConfigViewProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  currentScreen: 'SCREEN_1_INPUT' | 'SCREEN_2_PRE_SCAN' | 'SCREEN_3_LIVE_SCAN' | 'SCREEN_4_REPORT';
  onFetchTree: () => void;
  onStartScan: (url: string) => void;
  onBack: () => void;
}

export default function RepoConfigView({ repoUrl, setRepoUrl, currentScreen, onFetchTree, onStartScan, onBack }: RepoConfigViewProps) {
  const [isFetching, setIsFetching] = useState(false);

  const handleFetch = () => {
    if (!repoUrl) return;
    setIsFetching(true);
    // Directly start the scan bypassing any pre-scan views for maximum demo visibility
    onStartScan(repoUrl);
    setIsFetching(false);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in relative">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute -top-14 left-0 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      {/* Input Section */}
      <section className="flex flex-col items-center">
        <div className="w-full max-w-2xl flex relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input 
            type="text" 
            className="hacker-input w-full pl-12 pr-32 py-4 text-lg bg-[#141414]"
            placeholder="owner/repo or full GitHub URL"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            disabled={currentScreen === 'SCREEN_2_PRE_SCAN'}
            onKeyDown={e => e.key === 'Enter' && currentScreen === 'SCREEN_1_INPUT' && handleFetch()}
          />
          {currentScreen === 'SCREEN_1_INPUT' && (
            <button 
              className="absolute right-2 top-2 bottom-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded px-6 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]"
              onClick={handleFetch}
              disabled={isFetching || !repoUrl}
            >
              Start Security Scan
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
