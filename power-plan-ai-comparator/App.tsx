import React, { useState, useMemo, useEffect, useCallback } from 'react';
import UsageEditor from './components/UsageEditor';
import AIAssistant from './components/PlanImporter'; // Mobile fallback
import AISidebar from './components/AISidebar';
import CompanyCard, { CompanyGroup } from './components/CompanyCard';
import UsagePatterns from './components/UsagePatterns';
import { DEFAULT_PLANS, DEFAULT_WEEKLY_PROFILES, DAY_KEYS, WEEKDAY_KEYS, WEEKEND_KEYS, SPECIFIC_DAY_TYPES } from './constants';
import { calculateMonthlyCost } from './services/calculator';
import { PowerPlan, UsageProfile, UsageMode, DayKey, WeeklyUsageProfiles, DayType } from './types';

const MODE_RANK: Record<UsageMode, number> = { 'simple': 0, 'weekday-weekend': 1, 'per-day': 2 };

const getRecommendedMode = (plan: PowerPlan): UsageMode => {
  if (plan.rates.some(r => SPECIFIC_DAY_TYPES.includes(r.dayType as DayType))) return 'per-day';
  if (plan.rates.some(r => r.dayType === DayType.WEEKDAY || r.dayType === DayType.WEEKEND)) return 'weekday-weekend';
  return 'simple';
};

const MODE_OPTIONS: { key: UsageMode; label: string }[] = [
  { key: 'simple', label: 'Same Every Day' },
  { key: 'weekday-weekend', label: 'Weekday / Weekend' },
  { key: 'per-day', label: 'Per Day' },
];

const App: React.FC = () => {
  const [plans, setPlans] = useState<PowerPlan[]>(DEFAULT_PLANS);
  const [usageMode, setUsageMode] = useState<UsageMode>('simple');
  const [weeklyProfiles, setWeeklyProfiles] = useState<WeeklyUsageProfiles>(DEFAULT_WEEKLY_PROFILES);
  const [activeDay, setActiveDay] = useState<DayKey>('mon');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  const [includeBroadband, setIncludeBroadband] = useState(false);
  const [includeRewards, setIncludeRewards] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [showMobileAI, setShowMobileAI] = useState(false);

  // The currently visible/editable profile
  const activeProfile = weeklyProfiles[activeDay];

  // Mode-aware setter: updates the correct day(s) based on current mode
  const setActiveProfile = useCallback((newProfileOrUpdater: UsageProfile | ((prev: UsageProfile) => UsageProfile)) => {
    setWeeklyProfiles(prev => {
      const currentProfile = prev[activeDay];
      const newProfile = typeof newProfileOrUpdater === 'function'
        ? newProfileOrUpdater(currentProfile)
        : newProfileOrUpdater;

      const updated = { ...prev };

      if (usageMode === 'simple') {
        DAY_KEYS.forEach(key => { updated[key] = newProfile; });
      } else if (usageMode === 'weekday-weekend') {
        const isWeekend = WEEKEND_KEYS.includes(activeDay);
        const keysToUpdate = isWeekend ? WEEKEND_KEYS : WEEKDAY_KEYS;
        keysToUpdate.forEach(key => { updated[key] = newProfile; });
      } else {
        updated[activeDay] = newProfile;
      }

      return updated;
    });
  }, [activeDay, usageMode]);

  // Handle mode changes - non-destructive, just switches the view lens
  const handleModeChange = useCallback((newMode: UsageMode) => {
    if (newMode === 'simple') {
      setActiveDay('mon');
    } else if (newMode === 'weekday-weekend') {
      // Keep current day but snap to representative
      setActiveDay(WEEKEND_KEYS.includes(activeDay) ? 'sat' : 'mon');
    }
    // per-day: keep current activeDay
    setUsageMode(newMode);
  }, [activeDay]);

  // Calculate total for the Usage Editor display and passing to patterns
  const currentDailyKwh = useMemo(() => activeProfile.reduce((a,b) => a+b, 0), [activeProfile]);

  // Calculate costs for all plans whenever usage or plans change
  const results = useMemo(() => {
    return plans.map(plan => ({
      ...calculateMonthlyCost(plan, weeklyProfiles, includeBroadband, includeRewards),
      planId: plan.id
    })).sort((a, b) => a.monthlyTotal - b.monthlyTotal);
  }, [plans, weeklyProfiles, includeBroadband, includeRewards]);

  const cheapestPlanId = results[0]?.planId;

  // Initialize selected plan to the cheapest one on first load or if current selection is invalid
  useEffect(() => {
    if (!selectedPlanId && cheapestPlanId) {
        setSelectedPlanId(cheapestPlanId);
    }
  }, [cheapestPlanId, selectedPlanId]);

  // Auto-upgrade usage mode if plan requires it
  const autoSwitchMode = useCallback((plan: PowerPlan) => {
    const recommended = getRecommendedMode(plan);
    if (MODE_RANK[recommended] > MODE_RANK[usageMode]) {
      handleModeChange(recommended);
    }
  }, [usageMode, handleModeChange]);

  const handleAddPlan = (newPlan: PowerPlan) => {
    setPlans(prev => [...prev, newPlan]);
    setSelectedPlanId(newPlan.id);
    autoSwitchMode(newPlan);
  };

  const handleSelectPlan = useCallback((id: string) => {
    setSelectedPlanId(id);
    const plan = plans.find(p => p.id === id);
    if (plan) autoSwitchMode(plan);
  }, [plans, autoSwitchMode]);

  const handleDeletePlan = (id: string) => {
      setPlans(prev => prev.filter(p => p.id !== id));
      if (selectedPlanId === id) {
          setSelectedPlanId(null);
      }
  }

  // Determine which plan is active for coloring the graph
  const activePlan = plans.find(p => p.id === selectedPlanId) || plans.find(p => p.id === cheapestPlanId);

  // Group plans by provider for CompanyCard display
  const companyGroups = useMemo((): CompanyGroup[] => {
    const groupMap = new Map<string, CompanyGroup>();

    results.forEach(result => {
      const plan = plans.find(p => p.id === result.planId);
      if (!plan) return;

      if (!groupMap.has(plan.provider)) {
        groupMap.set(plan.provider, {
          provider: plan.provider,
          plans: [],
          results: [],
          bestMonthlyTotal: Infinity,
          planTypes: [],
          features: [],
        });
      }

      const group = groupMap.get(plan.provider)!;
      group.plans.push(plan);
      group.results.push(result);
      group.bestMonthlyTotal = Math.min(group.bestMonthlyTotal, result.monthlyTotal);
    });

    // Derive plan types and features for each group
    groupMap.forEach(group => {
      const types = new Set<string>();
      group.plans.forEach(p => {
        if (p.name.toLowerCase().includes('standard')) types.add('Standard');
        if (p.name.toLowerCase().includes('low')) types.add('Low User');
        if (p.rates.length > 1 || p.rates.some(r => r.dayType !== DayType.ALL)) types.add('Time-of-Use');
        if (p.rates.some(r => SPECIFIC_DAY_TYPES.includes(r.dayType as DayType))) types.add('Per-Day');
        if (p.rates.length === 1 && p.rates[0].startHour === 0 && p.rates[0].endHour === 23 && p.rates[0].dayType === DayType.ALL) types.add('Flat Rate');
      });
      group.planTypes = Array.from(types);

      const features = new Set<string>();
      group.plans.forEach(p => {
        if (p.rates.some(r => r.rateCents === 0)) features.add('Free Power Periods');
        if (p.joiningCreditDollars) features.add(`$${p.joiningCreditDollars} Credit`);
        if (p.discountPct) features.add(`${p.discountPct}% Discount`);
      });
      group.features = Array.from(features);
    });

    return Array.from(groupMap.values()).sort((a, b) => a.bestMonthlyTotal - b.bestMonthlyTotal);
  }, [results, plans]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
            &#9889;
          </div>
          <h1 className="text-lg font-semibold">Power Plan AI Comparator</h1>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Power Plan <span className="text-blue-500">Calculator</span>
            </h2>
            <p className="text-slate-400 mt-2 max-w-xl">
              Draw your daily usage habits on the graph below. We'll calculate your monthly bill across different providers instantly.
            </p>
          </div>

          {/* Usage Profile Section */}
          <section className="mb-8">
            <div className="flex flex-wrap justify-between items-end mb-4 gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-200">Daily Usage Profile</h2>
                  <div className="text-sm text-slate-500 mt-1">
                    Total: <span className="text-white font-mono font-bold">{currentDailyKwh.toFixed(1)} kWh</span> / day
                    {usageMode !== 'simple' && (
                      <span className="text-slate-600 ml-1">
                        ({WEEKEND_KEYS.includes(activeDay) ? 'Weekend' : 'Weekday'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Usage Mode Selector */}
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-medium">
                  {MODE_OPTIONS.map(mode => (
                    <button
                      key={mode.key}
                      onClick={() => handleModeChange(mode.key)}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        usageMode === mode.key
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
            </div>

            <div className="space-y-4">
                <UsageEditor
                    usage={activeProfile}
                    setUsage={setActiveProfile}
                    activePlan={activePlan}
                    usageMode={usageMode}
                    activeDay={activeDay}
                    setActiveDay={setActiveDay}
                />
                <UsagePatterns
                    setUsage={setActiveProfile}
                    currentTotal={currentDailyKwh}
                />
            </div>
          </section>

          {/* Mobile AI FAB + Bottom Sheet (hidden on desktop where sidebar is visible) */}
          {!showMobileAI && (
            <button
              onClick={() => setShowMobileAI(true)}
              className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all active:scale-95 z-40"
              title="AI Assistant"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] text-slate-900 font-bold">AI</span>
            </button>
          )}
          {showMobileAI && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileAI(false)} />
              <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-slate-900 rounded-t-2xl border-t border-slate-600 animate-slide-up">
                <div className="sticky top-0 bg-slate-900 px-5 pt-4 pb-2 flex justify-between items-center border-b border-slate-700/50 z-10">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="text-blue-400 text-lg">✨</span>
                    AI Assistant
                  </h3>
                  <button
                    onClick={() => setShowMobileAI(false)}
                    className="text-slate-500 hover:text-white bg-slate-700/50 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <AIAssistant
                    onImportPlan={(plan) => { handleAddPlan(plan); setShowMobileAI(false); }}
                    onUpdateUsage={(usage) => { setActiveProfile(usage); setShowMobileAI(false); }}
                    defaultOpen
                    embedded
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cost Estimates Section */}
          <section>
            <div className="flex flex-col gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-200">Cost Estimates</h2>

                  <div className="flex items-center gap-3">
                    {/* Rewards Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-400 font-medium hidden sm:inline">Joining Rewards</span>
                      <button
                          onClick={() => setIncludeRewards(!includeRewards)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${includeRewards ? 'bg-purple-500' : 'bg-slate-700'}`}
                      >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeRewards ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                      </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-800 p-1 rounded text-xs font-medium">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1 rounded transition-colors ${viewMode === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`px-3 py-1 rounded transition-colors ${viewMode === 'daily' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Daily
                        </button>
                    </div>
                  </div>
               </div>

               {/* Broadband Toggle - Hidden, code preserved for future use
               <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                   <span className="text-sm text-emerald-400 font-medium">Include 100Mbps Internet?</span>
                   <button
                      onClick={() => setIncludeBroadband(!includeBroadband)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${includeBroadband ? 'bg-emerald-500' : 'bg-slate-700'}`}
                   >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${includeBroadband ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
               </div>
               */}
            </div>

            {/* Top 3 Cheapest Plans Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {results.slice(0, 3).map((result, index) => {
                const plan = plans.find(p => p.id === result.planId);
                if (!plan) return null;
                const multiplier = viewMode === 'daily' ? 1 / 30 : 1;
                const displayTotal = result.monthlyTotal * multiplier;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      handleSelectPlan(plan.id);
                      setExpandedPlanId(plan.id);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                      index === 0
                        ? 'bg-gradient-to-br from-green-900/30 to-slate-800 border-green-500/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    } ${selectedPlanId === plan.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${index === 0 ? 'text-green-400' : 'text-slate-500'}`}>
                        #{index + 1}
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold uppercase truncate">{plan.provider}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm truncate">{plan.name}</h4>
                    <div className="text-xl font-black text-white mt-1">
                      <span className="text-xs text-slate-500 font-normal">$</span>
                      {displayTotal.toFixed(2)}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        {viewMode === 'monthly' ? '/mo' : '/day'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1">
                      View breakdown
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Company Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {companyGroups.map((group, index) => (
                <CompanyCard
                  key={group.provider}
                  group={group}
                  viewMode={viewMode}
                  cheapestPlanId={cheapestPlanId}
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={handleSelectPlan}
                  onDeletePlan={handleDeletePlan}
                  isBestProvider={index === 0}
                  expandedPlanId={expandedPlanId}
                />
              ))}
            </div>
          </section>

          <footer className="mt-16 text-center text-slate-600 text-sm">
              <p>Usage adjustments apply immediately. No data leaves your browser except for the AI plan importer.</p>
          </footer>
        </div>
      </main>

      {/* AI Sidebar - Desktop only */}
      <aside className="hidden lg:flex w-80 xl:w-96 border-l border-slate-700 bg-slate-800 flex-col flex-shrink-0 overflow-hidden">
        <AISidebar
          onImportPlan={handleAddPlan}
          onUpdateUsage={setActiveProfile}
        />
      </aside>
      </div>
    </div>
  );
};

export default App;
