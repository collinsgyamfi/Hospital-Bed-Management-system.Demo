import React, { useState } from 'react';
import { Info, RotateCcw, X, ShieldAlert } from 'lucide-react';
import { useHospital } from '../context/HospitalContext.tsx';

export const DemoDataBadge: React.FC = () => {
  const { resetDemo } = useHospital();
  const [dismissed, setDismissed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (dismissed) return null;

  const handleReset = async () => {
    if (confirm('Reset hospital database to standard Juaboso Government Hospital demonstration state?')) {
      setIsResetting(true);
      await resetDemo();
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-amber-950/70 border-b border-amber-500/30 text-amber-200 px-4 py-1.5 text-xs flex items-center justify-between gap-3 shadow-inner">
      <div className="flex items-center gap-2 overflow-hidden">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="font-bold tracking-wider text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase">
          Demonstration Mode
        </span>
        <span className="text-amber-200/90 truncate">
          Fictional patient identities and ward loads seeded for demonstration at Juaboso Government Hospital. Not actual live patient records.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/40 px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
          title="Reset database to fresh test records"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-100 p-0.5 rounded"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
