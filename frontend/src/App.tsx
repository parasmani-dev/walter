import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield } from 'lucide-react';
import LandingView from './components/LandingView';
import RepoConfigView from './components/RepoConfigView';
import LiveScanView from './components/LiveScanView';
import ReportView from './components/ReportView';
import WalterLoader from './components/WalterLoader';
import { motion } from 'framer-motion';

type ScreenState = 'SCREEN_0_LANDING' | 'SCREEN_1_INPUT' | 'SCREEN_2_PRE_SCAN' | 'SCREEN_3_LIVE_SCAN' | 'SCREEN_4_REPORT';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 font-mono text-red-500 bg-black min-h-screen">
          <h1 className="text-2xl font-bold mb-4">React App Crashed</h1>
          <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="whitespace-pre-wrap mt-4 text-gray-500">{this.state.error?.stack}</pre>
          <button onClick={() => window.location.reload()} className="mt-8 px-4 py-2 bg-red-900 text-white rounded">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('SCREEN_0_LANDING');
  const [repoUrl, setRepoUrl] = useState('');
  
  // Job State
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<any>(null);

  // Removed backend polling since we are using local simulation for the pitch
  useEffect(() => {
    // Cleanup any lingering intervals if component unmounts
    return () => {};
  }, []);

  const handleStartScan = (url: string) => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http') && formattedUrl.includes('/')) {
      formattedUrl = `https://github.com/${formattedUrl}`;
    }
    
    setRepoUrl(formattedUrl);
    setCurrentScreen('SCREEN_3_LIVE_SCAN');
    
    // Simulate real-time analysis taking about 7-10 seconds
    let prog = 0;
    setJobData({ progress: 0, status: 'RUNNING', currentAgent: 'SecretDetectorAgent' });
    
    const intervalId = setInterval(() => {
      prog += Math.floor(Math.random() * 8) + 4; // increment 4 to 11% every 700ms (~7-8 seconds total)
      if (prog >= 100) {
        prog = 100;
        clearInterval(intervalId);
        setJobData({ progress: 100, status: 'COMPLETED', result: {} });
        setTimeout(() => setCurrentScreen('SCREEN_4_REPORT'), 500);
      } else {
        let agent = 'SecretDetectorAgent';
        if (prog > 25) agent = 'VulnAnalyzerAgent';
        if (prog > 50) agent = 'RegressionMemoryAgent';
        if (prog > 75) agent = 'ValidationAgent';
        setJobData({ progress: prog, status: 'RUNNING', currentAgent: agent });
      }
    }, 700);
  };

  const Header = () => (
    <header className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setCurrentScreen('SCREEN_0_LANDING')}>
      <img src="/logo.png" alt="Walter Logo" className="w-10 h-10 object-contain mix-blend-screen" style={{ filter: 'invert(1) sepia(1) hue-rotate(330deg) saturate(3)' }} />
      <h1 className="text-2xl font-mono font-bold tracking-widest text-white">WALTER</h1>
    </header>
  );

  return (
    <div className={`min-h-screen ${currentScreen !== 'SCREEN_0_LANDING' ? 'p-6' : ''}`}>
      {currentScreen !== 'SCREEN_0_LANDING' && <Header />}

      <main className={currentScreen !== 'SCREEN_0_LANDING' ? 'pb-24' : ''}>
        {currentScreen === 'SCREEN_0_LANDING' && (
          <LandingView onGetStarted={() => setCurrentScreen('SCREEN_1_INPUT')} />
        )}
        
        {(currentScreen === 'SCREEN_1_INPUT') && (
          <RepoConfigView 
            repoUrl={repoUrl}
            setRepoUrl={setRepoUrl}
            currentScreen={currentScreen}
            onFetchTree={() => {}} // Removed
            onStartScan={handleStartScan}
            onBack={() => setCurrentScreen('SCREEN_0_LANDING')}
          />
        )}

        {currentScreen === 'SCREEN_3_LIVE_SCAN' && (
          <LiveScanView jobData={jobData} onBack={() => setCurrentScreen('SCREEN_1_INPUT')} />
        )}

        {currentScreen === 'SCREEN_4_REPORT' && (
          <ReportView report={jobData?.result?.jsonReport} status={jobData?.status} error={jobData?.error} onBack={() => setCurrentScreen('SCREEN_1_INPUT')} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <ErrorBoundary>
      {!isLoaded && <WalterLoader onComplete={() => setIsLoaded(true)} />}
      {isLoaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <MainApp />
        </motion.div>
      )}
    </ErrorBoundary>
  );
}
