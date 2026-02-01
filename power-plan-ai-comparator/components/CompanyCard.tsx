import React, { useState, useEffect } from 'react';
import { PowerPlan, CalculationResult } from '../types';
import PlanDetailRow from './PlanDetailRow';

export interface CompanyGroup {
  provider: string;
  plans: PowerPlan[];
  results: (CalculationResult & { planId: string })[];
  bestMonthlyTotal: number;
  planTypes: string[];
  features: string[];
}

interface CompanyCardProps {
  group: CompanyGroup;
  viewMode: 'monthly' | 'daily';
  cheapestPlanId: string;
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  isBestProvider: boolean;
  expandedPlanId: string | null;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  group,
  viewMode,
  cheapestPlanId,
  selectedPlanId,
  onSelectPlan,
  onDeletePlan,
  isBestProvider,
  expandedPlanId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand/collapse when a plan is focused from top-3 strip
  useEffect(() => {
    if (expandedPlanId) {
      const hasMatch = group.plans.some(p => p.id === expandedPlanId);
      setIsExpanded(hasMatch);
    }
  }, [expandedPlanId, group.plans]);

  const multiplier = viewMode === 'daily' ? 1 / 30 : 1;
  const bestPrice = group.bestMonthlyTotal * multiplier;

  // Sort results by price within this group
  const sortedResults = [...group.results].sort((a, b) => a.monthlyTotal - b.monthlyTotal);

  return (
    <div data-provider={group.provider} className={`rounded-xl border transition-all ${
      isBestProvider
        ? 'border-green-500/40 bg-gradient-to-br from-slate-800 to-green-950/20'
        : 'border-slate-700 bg-slate-800'
    }`}>
      {/* Collapsed header - always visible */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white truncate">{group.provider}</h3>
              {isBestProvider && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-600 text-white flex-shrink-0">
                  Best Value
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 mb-2">
              {group.plans.length} plan{group.plans.length !== 1 ? 's' : ''} available
            </div>

            {/* Plan type tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {group.planTypes.map((type, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">
                  {type}
                </span>
              ))}
            </div>

            {/* Feature badges */}
            {group.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {group.features.map((feat, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/40">
                    {feat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end flex-shrink-0 ml-3">
            <div className="text-[10px] text-slate-500 uppercase mb-0.5">From</div>
            <div className="text-xl font-black text-white">
              <span className="text-xs font-normal text-slate-500">$</span>{bestPrice.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">
              {viewMode === 'monthly' ? '/mo' : '/day'}
            </div>
            <svg
              className={`w-4 h-4 text-slate-500 mt-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded plan list */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3 animate-fade-in">
          {sortedResults.map(result => {
            const plan = group.plans.find(p => p.id === result.planId);
            if (!plan) return null;
            return (
              <PlanDetailRow
                key={plan.id}
                plan={plan}
                result={result}
                viewMode={viewMode}
                isCheapest={plan.id === cheapestPlanId}
                isSelected={plan.id === selectedPlanId}
                onSelect={() => onSelectPlan(plan.id)}
                onDelete={() => onDeletePlan(plan.id)}
                autoExpand={plan.id === expandedPlanId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyCard;
