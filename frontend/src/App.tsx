import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ScannerForm } from './components/ScannerForm';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ReportView } from './components/ReportView';
import { ErrorState } from './components/ErrorState';
import { Shield } from 'lucide-react';

type AppState = 'IDLE' | 'POLLING' | 'COMPLETED' | 'FAILED';

export default function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<any>(null);

  const handleScan = async (url: string) => {
    try {
      setAppState('POLLING');
      setJobData(null);
      const res = await axios.post('http://localhost:3000/scan', { repositoryUrl: url });
      setJobId(res.data.jobId);
    } catch (err: any) {
      setAppState('FAILED');
      setJobData({
        status: 'FAILED',
        errorType: err.response?.data?.errorType || 'GENERIC_ERROR',
        error: err.response?.data?.error || err.message
      });
    }
  };

  useEffect(() => {
    let intervalId: any;

    const pollJob = async () => {
      if (!jobId) return;
      try {
        const res = await axios.get(`http://localhost:3000/scan/${jobId}`);
        setJobData(res.data);
        
        if (res.data.status === 'COMPLETED') {
          setAppState('COMPLETED');
          clearInterval(intervalId);
        } else if (res.data.status === 'FAILED') {
          setAppState('FAILED');
          clearInterval(intervalId);
        }
      } catch (err: any) {
        setAppState('FAILED');
        setJobData({
          status: 'FAILED',
          errorType: 'GENERIC_ERROR',
          error: 'Connection lost or API error'
        });
        clearInterval(intervalId);
      }
    };

    if (appState === 'POLLING' && jobId) {
      pollJob(); // Initial poll
      intervalId = setInterval(pollJob, 2500); // 2.5s interval
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [appState, jobId]);

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center gap-3 mb-12">
        <Shield className="w-8 h-8 text-[var(--color-status-resolved)]" />
        <h1 className="text-2xl font-mono font-bold tracking-widest text-white">WALTER</h1>
      </header>

      <main className="pb-24">
        {(appState === 'IDLE' || appState === 'POLLING' || appState === 'FAILED') && (
          <ScannerForm onScan={handleScan} isLoading={appState === 'POLLING'} />
        )}

        {(appState === 'POLLING' || (appState === 'FAILED' && jobData?.progress)) && (
          <ProgressIndicator currentProgress={jobData?.progress} status={jobData?.status} />
        )}

        {appState === 'FAILED' && jobData?.errorType && (
          <ErrorState errorType={jobData.errorType} errorMessage={jobData.error} />
        )}

        {appState === 'COMPLETED' && jobData?.result && (
          <ReportView report={jobData.result} />
        )}
      </main>
    </div>
  );
}
