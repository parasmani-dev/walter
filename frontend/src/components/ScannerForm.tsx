import React, { useState } from 'react';
import { Terminal, ArrowRight } from 'lucide-react';

interface ScannerFormProps {
  onScan: (url: string) => void;
  isLoading: boolean;
}

export function ScannerForm({ onScan, isLoading }: ScannerFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onScan(url.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 hacker-card p-6 border-l-4 border-l-[var(--color-status-resolved)]">
      <div className="flex items-center gap-3 mb-6">
        <Terminal className="w-6 h-6 text-[var(--color-status-resolved)]" />
        <h2 className="text-xl font-mono text-white tracking-tight">WALTER_TARGET_ACQUISITION</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo.git"
          className="flex-1 hacker-input px-4 py-3 font-mono text-sm"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="hacker-button px-6 py-3 flex items-center gap-2 uppercase tracking-wider text-sm"
        >
          {isLoading ? 'Scanning...' : 'Initialize'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
