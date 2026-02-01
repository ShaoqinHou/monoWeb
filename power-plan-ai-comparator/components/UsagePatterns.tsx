import React, { useState, useEffect } from 'react';
import { USAGE_PATTERNS } from '../constants';
import { UsageProfile } from '../types';

interface UsagePatternsProps {
  setUsage: (u: UsageProfile | ((prev: UsageProfile) => UsageProfile)) => void;
  currentTotal: number;
}

const UsagePatterns: React.FC<UsagePatternsProps> = ({ setUsage, currentTotal }) => {
  const [targetTotal, setTargetTotal] = useState<number>(20);

  // Sync internal state if external usage changes significantly on mount
  useEffect(() => {
     if (Math.abs(currentTotal - targetTotal) > 2) {
         setTargetTotal(Math.round(currentTotal * 10) / 10);
     }
  }, []);

  const applyPattern = (patternKey: string) => {
    const pattern = USAGE_PATTERNS[patternKey as keyof typeof USAGE_PATTERNS].profile;
    
    const patternSum = pattern.reduce((a, b) => a + b, 0);
    
    // Work with integers (centi-kWh) to ensure exact sum matching without floating point drift
    const targetCents = Math.round(targetTotal * 100);
    
    // Calculate raw shares
    const rawShares = pattern.map(v => (v / patternSum) * targetCents);
    
    // Initial integer floor
    const finalShares = rawShares.map(v => Math.floor(v));
    
    // Calculate remainder to distribute
    const currentSum = finalShares.reduce((a, b) => a + b, 0);
    const remainder = targetCents - currentSum;
    
    // Distribute remainder using Largest Remainder Method:
    // Give the extra cents to the hours that had the largest decimal parts dropped by Math.floor()
    const decimalParts = rawShares.map((v, i) => ({ index: i, decimals: v - Math.floor(v) }));
    
    // Sort descending by decimal portion
    decimalParts.sort((a, b) => b.decimals - a.decimals);
    
    // Distribute 1 cent to the top 'remainder' buckets
    for (let i = 0; i < remainder; i++) {
        finalShares[decimalParts[i].index] += 1;
    }

    // Convert back to kWh (2 decimal precision)
    setUsage(finalShares.map(v => v / 100));
  };

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
          setTargetTotal(val);
      }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Quick Patterns</h3>
          
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
              <label className="text-xs text-slate-500 pl-1">Daily kWh:</label>
              <input 
                type="number" 
                value={targetTotal}
                onChange={handleTotalChange}
                step="0.1"
                className="w-20 bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:border-blue-500 outline-none text-center font-mono"
              />
          </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(USAGE_PATTERNS).map(([key, data]) => (
          <button
            key={key}
            onClick={() => applyPattern(key)}
            className="flex-1 min-w-[100px] py-2 px-3 bg-slate-700 hover:bg-slate-600 active:bg-blue-600 text-xs font-medium text-slate-200 rounded transition-colors border border-slate-600 hover:border-slate-500"
          >
            {data.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UsagePatterns;