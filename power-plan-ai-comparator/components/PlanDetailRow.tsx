import React, { useState, useEffect, useRef } from 'react';
import { PowerPlan, CalculationResult, DayType } from '../types';

interface PlanDetailRowProps {
  plan: PowerPlan;
  result: CalculationResult;
  viewMode: 'monthly' | 'daily';
  isCheapest: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  autoExpand?: boolean;
}

const PlanDetailRow: React.FC<PlanDetailRowProps> = ({ plan, result, viewMode, isCheapest, isSelected, onSelect, onDelete, autoExpand }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoExpand) {
      setShowBreakdown(true);
      setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [autoExpand]);

  const multiplier = viewMode === 'daily' ? 1 / 30 : 1;
  const displayTotal = result.monthlyTotal * multiplier;
  const displayFixed = result.breakdown.fixedCost * multiplier;
  const displayDiscount = result.breakdown.discountCost * multiplier;

  const groupedRates = {
    weekdays: plan.rates.filter(r => r.dayType === DayType.WEEKDAY).sort((a, b) => a.startHour - b.startHour),
    weekends: plan.rates.filter(r => r.dayType === DayType.WEEKEND).sort((a, b) => a.startHour - b.startHour),
    all: plan.rates.filter(r => r.dayType === DayType.ALL).sort((a, b) => a.startHour - b.startHour),
  };

  const formatTime = (start: number, end: number) => {
    if (start === 0 && end === 23) return 'All Day';
    const formatH = (h: number) => {
      if (h === 0 || h === 24) return '12am';
      if (h === 12) return '12pm';
      return h > 12 ? `${h - 12}pm` : `${h}am`;
    };
    return `${formatH(start)}-${formatH(end + 1)}`;
  };

  // Build a short rate summary
  const rateSummary = () => {
    const allRates = [...groupedRates.all, ...groupedRates.weekdays, ...groupedRates.weekends];
    if (allRates.length === 1 && allRates[0].startHour === 0 && allRates[0].endHour === 23) {
      return allRates[0].rateCents === 0 ? 'Free' : `${allRates[0].rateCents}c flat`;
    }
    const uniqueRates = [...new Set(allRates.map(r => r.rateCents === 0 ? 'Free' : `${r.rateCents}c`))];
    return uniqueRates.join(' / ');
  };

  const renderRateRow = (r: any, idx: number) => (
    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-0">
      <span className="text-slate-400">{formatTime(r.startHour, r.endHour)}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{r.zoneName}</span>
        <span className={`font-mono ${r.rateCents === 0 ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
          {r.rateCents === 0 ? 'FREE' : `${r.rateCents}c`}
        </span>
      </div>
    </div>
  );

  return (
    <div ref={rowRef} className={`rounded-lg border transition-colors ${
      isSelected
        ? 'border-blue-500 bg-slate-700/40'
        : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
    }`}>
      {/* Row header */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onSelect}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-200 truncate">{plan.name}</h4>
            {isCheapest && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-600 text-white flex-shrink-0">Best</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {rateSummary()} | {plan.fixedDailyChargeCents}c/day
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <div className="text-right">
            <div className="text-lg font-black text-white">
              <span className="text-xs font-normal text-slate-500">$</span>{displayTotal.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">
              {viewMode === 'monthly' ? '/mo' : '/day'}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowBreakdown(!showBreakdown); }}
              className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
              title="View breakdown"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-slate-700 transition-colors"
              title="Remove plan"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable breakdown */}
      {showBreakdown && (
        <div className="px-3 pb-3 border-t border-slate-700/50 pt-3 text-xs space-y-3 animate-fade-in">
          {/* Cost breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Fixed Charge</span>
              <span className="text-slate-300">${displayFixed.toFixed(2)}</span>
            </div>

            {result.breakdown.categories.map((cat, idx) => {
              const catCost = cat.totalCost * multiplier;
              const catKwh = cat.totalKwh * multiplier;
              const isFree = cat.avgRateCents === 0;
              return (
                <div key={idx} className="flex justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    {cat.name} <span className="text-slate-600">({catKwh.toFixed(1)} kWh)</span>
                  </div>
                  {isFree ? (
                    <span className="text-blue-400 font-bold uppercase">FREE</span>
                  ) : (
                    <span className="text-slate-300">${catCost.toFixed(2)}</span>
                  )}
                </div>
              );
            })}

            {displayDiscount > 0 && (
              <div className="flex justify-between text-purple-400">
                <span>Rewards</span>
                <span>-${displayDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold text-white">
              <span>Total</span>
              <span>${displayTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Rate schedule */}
          <div className="pt-2 border-t border-slate-700">
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Rate Schedule</div>
            <div className="font-mono text-[11px] space-y-2">
              {groupedRates.all.length > 0 && (
                <div>
                  <span className="text-blue-400 text-[10px] font-bold">Every Day</span>
                  {groupedRates.all.map(renderRateRow)}
                </div>
              )}
              {groupedRates.weekdays.length > 0 && (
                <div>
                  <span className="text-orange-400 text-[10px] font-bold">Weekdays</span>
                  {groupedRates.weekdays.map(renderRateRow)}
                </div>
              )}
              {groupedRates.weekends.length > 0 && (
                <div>
                  <span className="text-green-400 text-[10px] font-bold">Weekends</span>
                  {groupedRates.weekends.map(renderRateRow)}
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-700 text-slate-400">
                <span>Daily Charge</span>
                <span className="text-slate-300">{plan.fixedDailyChargeCents}c/day</span>
              </div>
              {plan.joiningCreditDollars && (
                <div className="flex justify-between text-purple-400">
                  <span>Joining Credit</span>
                  <span>${plan.joiningCreditDollars} one-off</span>
                </div>
              )}
              {plan.discountPct && (
                <div className="flex justify-between text-purple-400">
                  <span>Discount</span>
                  <span>{plan.discountPct}% off usage</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanDetailRow;
