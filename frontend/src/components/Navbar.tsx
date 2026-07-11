import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface NavbarProps {
  onStartScanning: () => void;
}

export default function Navbar({ onStartScanning }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-[#09090B]/80 backdrop-blur-md border-[rgba(255,255,255,0.08)] py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center cursor-pointer">
          <span className="font-black text-2xl tracking-tight">
            <span className="text-[#7C3AED]">W</span>alter
          </span>
        </div>

        {/* Center: Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center space-x-8 text-base font-medium text-[#A1A1AA]">
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}} className="hover:text-white transition-colors flex items-center gap-1 group">
            Features
          </a>
          <a href="#powered-by" onClick={(e) => { e.preventDefault(); document.getElementById('powered-by')?.scrollIntoView({ behavior: 'smooth' })}} className="hover:text-white transition-colors flex items-center gap-1 group">
            Powered By
          </a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}} className="hover:text-white transition-colors flex items-center gap-1 group">
            How It Works
          </a>
          <a href="https://github.com/parasmani-dev/walter" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1 group">
            Open Source
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <a href="https://github.com/parasmani-dev" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 text-base font-semibold text-[#A1A1AA] hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/5 border border-transparent">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <button 
            onClick={onStartScanning}
            className="bg-[#7C3AED] text-white font-semibold text-base px-6 py-2.5 rounded-md hover:bg-[#6D28D9] transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            Start Scanning
          </button>
        </div>
      </div>
    </nav>
  );
}
