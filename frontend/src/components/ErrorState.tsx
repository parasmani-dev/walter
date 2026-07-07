import React from 'react';
import { AlertTriangle, Lock, Link, HardDrive, ServerCrash } from 'lucide-react';

interface ErrorStateProps {
  errorType?: string;
  errorMessage?: string;
}

export function ErrorState({ errorType, errorMessage }: ErrorStateProps) {
  let Icon = AlertTriangle;
  let title = "SCAN_FAILURE";
  let description = errorMessage || "An unknown system error occurred during execution.";

  switch (errorType) {
    case 'INVALID_URL':
      Icon = Link;
      title = "ERR_INVALID_TARGET";
      description = "The provided URL is not a valid git repository. Ensure the URL is correct and publicly accessible.";
      break;
    case 'PRIVATE_REPO':
      Icon = Lock;
      title = "ERR_ACCESS_DENIED";
      description = "The repository is private or requires authentication. Walter currently only supports public repositories.";
      break;
    case 'OVERSIZED_REPO':
      Icon = HardDrive;
      title = "ERR_CAPACITY_EXCEEDED";
      description = "The repository exceeds the hard cap of 5,000 files. To ensure system stability, the scan was aborted.";
      break;
    case 'GENERIC_ERROR':
    default:
      Icon = ServerCrash;
      title = "ERR_SYSTEM_FAULT";
      break;
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 hacker-card p-6 border-l-4 border-l-[var(--color-status-critical)]">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-[var(--color-status-critical)] bg-opacity-10 rounded-sm">
          <Icon className="w-6 h-6 text-[var(--color-status-critical)]" />
        </div>
        <div>
          <h3 className="font-mono text-lg font-bold text-[var(--color-status-critical)] uppercase tracking-wide">
            {title}
          </h3>
          <p className="mt-2 text-[var(--color-text-body)] opacity-90 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
