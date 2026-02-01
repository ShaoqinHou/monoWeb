import React, { useState } from 'react';
import { PowerPlan, CalculationResult, DayType } from '../types';

interface PlanCardProps {
  plan: PowerPlan;
  result: CalculationResult;
  isCheapest: boolean;
  isSelected: boolean;
  viewMode: 'monthly' | 'daily';
  onSelect: () => void;
  onDelete: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, result, isCheapest, isSelected, viewMode, onSelect, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const multiplier = viewMode === 'daily' ? 1 / 30 : 1;
  const displayTotal = result.monthlyTotal * multiplier;
  const displayFixed = result.breakdown.fixedCost * multiplier;
  const displayUsage = result.breakdown.usageCost * multiplier;
  const displayBroadband = result.breakdown.broadbandCost * multiplier;
  const displayDiscount = result.breakdown.discountCost * multiplier;

  // Helper to group rates for cleaner display
  const groupedRates = {
      weekdays: plan.rates.filter(r => r.dayType === DayType.WEEKDAY).sort((a,b) => a.startHour - b.startHour),
      weekends: plan.rates.filter(r => r.dayType === DayType.WEEKEND).sort((a,b) => a.startHour - b.startHour),
      all: plan.rates.filter(r => r.dayType === DayType.ALL).sort((a,b) => a.startHour - b.startHour),
  };

  const formatTime = (start: number, end: number) => {
      if (start === 0 && end === 23) return 'All Day';
      const formatH = (h: number) => {
          if (h === 0 || h === 24) return 'Midnight';
          if (h === 12) return 'Noon';
          return h > 12 ? `${h-12}pm` : `${h}am`;
      };
      return `${formatH(start)} - ${formatH(end + 1)}`;
  };

  const renderRateRow = (r: any, idx: number) => (
      <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-0">
          <span className="text-slate-400">{formatTime(r.startHour, r.endHour)}</span>
          <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{r.zoneName}</span>
              <span className={`font-mono ${r.rateCents === 0 ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                  {r.rateCents === 0 ? 'FREE' : `${r.rateCents}¢`}
              </span>
          </div>
      </div>
  );

  return (
    <div 
        className={`relative bg-slate-800 rounded-xl transition-all duration-200 overflow-hidden group cursor-default ${
            isSelected 
                ? 'ring-2 ring-blue-500 transform scale-[1.01] shadow-xl shadow-blue-900/20' 
                : isCheapest 
                    ? 'border border-green-500/50' 
                    : 'border border-slate-700 hover:border-slate-500'
        }`}
        onMouseEnter={onSelect}
    >
      {isCheapest && (
        <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm uppercase tracking-wider z-10">
            Best Price
        </div>
      )}

      {/* Header Section */}
      <div className={`p-5 ${isSelected ? 'bg-slate-700/50' : 'bg-gradient-to-br from-slate-800 to-slate-900'}`}>
          <div className="flex justify-between items-start">
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">{plan.provider}</p>
                <h3 className="text-lg font-bold text-slate-100 leading-tight flex items-center gap-2">
                    {plan.name}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {displayBroadband > 0 && (
                    <div className="inline-block px-1.5 py-0.5 rounded bg-emerald-900/50 border border-emerald-800 text-[10px] text-emerald-400 font-semibold">
                        + Broadband
                    </div>
                  )}
                  {displayDiscount > 0 && (
                    <div className="inline-block px-1.5 py-0.5 rounded bg-purple-900/50 border border-purple-800 text-[10px] text-purple-300 font-semibold">
                        Rewards Applied
                    </div>
                  )}
                </div>
            </div>
            <div className="text-right pl-4">
                <div className="text-2xl font-black text-white tracking-tight">
                    <span className="text-sm font-normal text-slate-500 align-top mr-1">$</span>
                    {displayTotal.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-medium">
                    {viewMode === 'monthly' ? 'Est. Monthly' : 'Avg. Daily'}
                </div>
            </div>
          </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-slate-700 divide-x divide-slate-700">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 py-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
              {showDetails ? (
                  <><span>Hide Breakdown</span> <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
              ) : (
                  <><span>View Breakdown</span> <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
              )}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="px-4 text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
            title="Remove Plan"
          >
            ✕
          </button>
      </div>

      {/* Expandable Detail View */}
      {showDetails && (
          <div className="bg-slate-900/50 p-5 text-sm border-t border-slate-700 animate-fade-in">
              
              {/* Invoice Breakdown */}
              <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-700 pb-1">
                      Cost Breakdown ({viewMode === 'monthly' ? '30 Days' : '1 Day'})
                  </h4>
                  <div className="space-y-3">
                      
                      {/* Fixed Costs */}
                      <div className="flex justify-between items-start text-slate-300">
                          <div>
                              <div className="font-medium">Fixed Daily Charge</div>
                              <div className="text-xs text-slate-500">
                                  {viewMode === 'monthly' 
                                    ? `30 days @ ${plan.fixedDailyChargeCents}¢/day` 
                                    : `${plan.fixedDailyChargeCents}¢/day`}
                              </div>
                          </div>
                          <span>${displayFixed.toFixed(2)}</span>
                      </div>

                      {/* Dynamic Categories */}
                      {result.breakdown.categories.map((cat, idx) => {
                          const catCost = cat.totalCost * multiplier;
                          const catKwh = cat.totalKwh * multiplier;
                          const isFree = cat.avgRateCents === 0;
                          return (
                            <div key={idx} className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 font-medium text-slate-300">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                        {cat.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {isFree
                                          ? `${catKwh.toFixed(1)} kWh consumed`
                                          : `${catKwh.toFixed(1)} kWh @ ${cat.avgRateCents.toFixed(1)}¢/kWh`
                                        }
                                    </div>
                                </div>
                                {isFree ? (
                                  <span className="text-blue-400 font-bold text-xs uppercase">FREE</span>
                                ) : (
                                  <span className="text-slate-300">${catCost.toFixed(2)}</span>
                                )}
                            </div>
                          );
                      })}

                      {/* Broadband Cost */}
                      {displayBroadband > 0 && (
                        <div className="flex justify-between items-start text-emerald-400 bg-emerald-900/20 p-2 rounded">
                            <div>
                                <div className="font-medium">Broadband Bundle</div>
                                <div className="text-xs text-emerald-600/80">
                                    100Mbps Plan
                                </div>
                            </div>
                            <span>${displayBroadband.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Discount / Rewards */}
                      {displayDiscount > 0 && (
                        <div className="flex justify-between items-start text-purple-400 bg-purple-900/20 p-2 rounded">
                            <div>
                                <div className="font-medium">Joining Rewards</div>
                                <div className="text-xs text-purple-400/80">
                                    {plan.joiningCreditDollars 
                                        ? `Includes $${plan.joiningCreditDollars} Credit (Amortized)` 
                                        : `Includes ${plan.discountPct}% Plan Discount`}
                                </div>
                            </div>
                            <span>-${displayDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between items-center font-bold text-white text-base">
                          <span>Total Estimate</span>
                          <span>${displayTotal.toFixed(2)}</span>
                      </div>
                  </div>
              </div>
              
              {/* Plan Rules Reference */}
              <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-700 pb-1">Plan Rules</h4>
                  <div className="text-xs font-mono space-y-3">
                    
                    {groupedRates.all.length > 0 && (
                        <div>
                            <div className="text-blue-400 font-bold mb-1">Every Day</div>
                            {groupedRates.all.map(renderRateRow)}
                        </div>
                    )}

                    {groupedRates.weekdays.length > 0 && (
                        <div>
                            <div className="text-orange-400 font-bold mb-1">Weekdays</div>
                            {groupedRates.weekdays.map(renderRateRow)}
                        </div>
                    )}

                    {groupedRates.weekends.length > 0 && (
                        <div>
                            <div className="text-green-400 font-bold mb-1">Weekends</div>
                            {groupedRates.weekends.map(renderRateRow)}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                        <span className="text-slate-400">Daily Charge</span>
                        <span className="text-slate-300">{plan.fixedDailyChargeCents}¢ / day</span>
                    </div>
                    {/* Broadband info hidden per user request, code preserved
                    {plan.broadbandMonthlyCost && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                            <span className="text-emerald-500 font-bold">Broadband</span>
                            <span className="text-emerald-400">${plan.broadbandMonthlyCost} / month</span>
                        </div>
                    )}
                    */}
                    {plan.joiningCreditDollars && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                            <span className="text-purple-500 font-bold">Joining Credit</span>
                            <span className="text-purple-400">${plan.joiningCreditDollars} one-off</span>
                        </div>
                    )}
                    {plan.discountPct && (
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                            <span className="text-purple-500 font-bold">Discount</span>
                            <span className="text-purple-400">{plan.discountPct}% off usage</span>
                        </div>
                    )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PlanCard;