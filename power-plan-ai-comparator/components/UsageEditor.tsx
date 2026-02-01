import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { UsageProfile, UsageMode, DayKey, PowerPlan, ZoneColor, DayType } from '../types';
import { DAY_KEYS, DAY_LABELS, WEEKDAY_KEYS, WEEKEND_KEYS } from '../constants';
import { getZoneColorForHour } from '../services/calculator';

interface UsageEditorProps {
  usage: UsageProfile;
  setUsage: (u: UsageProfile | ((prev: UsageProfile) => UsageProfile)) => void;
  activePlan?: PowerPlan;
  usageMode: UsageMode;
  activeDay: DayKey;
  setActiveDay: (day: DayKey) => void;
}

const UsageEditor: React.FC<UsageEditorProps> = ({ usage, setUsage, activePlan, usageMode, activeDay, setActiveDay }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isWeekend = WEEKEND_KEYS.includes(activeDay);

  // Calculate dynamic legend items based on what is VISIBLE in the graph for the active day
  const legendItems = useMemo(() => {
    if (!activePlan) {
        return [{ label: 'Standard', color: '#f97316' }];
    }

    const visibleZones = new Map<string, string>();

    const getColor = (zc: ZoneColor) => {
        switch (zc) {
            case ZoneColor.PEAK: return '#ef4444';
            case ZoneColor.SHOULDER: return '#f97316';
            case ZoneColor.OFF_PEAK: return '#22c55e';
            case ZoneColor.FREE: return '#3b82f6';
            default: return '#94a3b8';
        }
    };

    const dayType = isWeekend ? DayType.WEEKEND : DayType.WEEKDAY;

    for (let i = 0; i < 24; i++) {
        // Same lookup as calculator: try specific day type first, fall back to ALL
        let rate = activePlan.rates.find(r => r.startHour <= i && r.endHour >= i && r.dayType === dayType);
        if (!rate) {
            rate = activePlan.rates.find(r => r.startHour <= i && r.endHour >= i && r.dayType === DayType.ALL);
        }
        if (rate) {
            visibleZones.set(rate.zoneName, getColor(rate.zoneColor));
        }
    }

    return Array.from(visibleZones.entries()).map(([label, color]) => ({ label, color }));
  }, [activePlan, isWeekend]);


  // Unified Paint Logic
  const paint = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // 1. Calculate X-Index
    const relativeX = clientX - rect.left;
    const barWidth = rect.width / 24;
    let index = Math.floor(relativeX / barWidth);

    // Clamp index
    if (index < 0) index = 0;
    if (index > 23) index = 23;

    // 2. Calculate Y-Value
    const relativeY = rect.bottom - clientY;
    const height = rect.height;

    let newValue = (relativeY / height) * 5;
    if (newValue < 0) newValue = 0;
    if (newValue > 5) newValue = 5;

    // Snap to 2 decimals
    newValue = Math.round(newValue * 100) / 100;

    setUsage((prevUsage) => {
        if (prevUsage[index] === newValue) return prevUsage;
        const newUsage = [...prevUsage];
        newUsage[index] = newValue;
        return newUsage;
    });
  }, [setUsage]);

  // Mouse Down: Start drawing and paint immediately
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDrawing(true);
    paint(e.clientX, e.clientY);
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDrawing(true);
    paint(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDrawing) {
        paint(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Global Mouse Listeners
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDrawing) {
        e.preventDefault();
        paint(e.clientX, e.clientY);
      }
    };

    const handleGlobalUp = () => {
      setIsDrawing(false);
    };

    if (isDrawing) {
        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDrawing, paint]);

  // Stop drawing on touch end
  useEffect(() => {
      const handleTouchEnd = () => setIsDrawing(false);
      window.addEventListener('touchend', handleTouchEnd);
      return () => window.removeEventListener('touchend', handleTouchEnd);
  }, []);

  return (
    <div className="w-full p-4 bg-slate-800 rounded-xl shadow-lg border border-slate-700 no-select">
      {/* Day Selector Tabs - shown when not in simple mode */}
      {usageMode !== 'simple' && (
        <div className="flex gap-1 mb-3">
          {usageMode === 'weekday-weekend' ? (
            <>
              <button
                onClick={() => setActiveDay('mon')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  WEEKDAY_KEYS.includes(activeDay)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Weekdays
              </button>
              <button
                onClick={() => setActiveDay('sat')}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  WEEKEND_KEYS.includes(activeDay)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Weekends
              </button>
            </>
          ) : (
            DAY_KEYS.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeDay === day
                    ? 'bg-blue-600 text-white'
                    : WEEKEND_KEYS.includes(day)
                      ? 'bg-slate-700/70 text-slate-500 hover:text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex justify-between items-end mb-2 text-slate-400 text-xs uppercase tracking-wider">
        <span>Midnight</span>
        <span>Noon</span>
        <span>Midnight</span>
      </div>

      <div
        className="relative h-64 w-full flex items-end justify-between gap-0 touch-none cursor-crosshair"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Background Grid Lines */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-20 z-0">
            {[...Array(5)].map((_, i) => (
                 <div key={i} className="border-t border-slate-100 w-full"></div>
            ))}
        </div>

        {usage.map((val, i) => {
          const max = 5;
          const percentage = Math.min((val / max) * 100, 100);
          const barColor = activePlan ? getZoneColorForHour(activePlan, i, isWeekend) : '#3b82f6';

          return (
            <div
              key={i}
              className="h-full flex-1 flex flex-col justify-end group relative px-[1px]"
            >
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded py-1 px-2 z-20 whitespace-nowrap border border-slate-600 shadow-lg pointer-events-none">
                {i}:00 - <span className="font-mono text-blue-300 font-bold">{val.toFixed(2)}</span> kWh
              </div>

              <div
                className="w-full bg-slate-700/50 rounded-t-sm relative overflow-hidden pointer-events-none"
                style={{ height: '100%' }}
              >
                 <div
                    className="absolute bottom-0 left-0 w-full transition-all duration-75 ease-out"
                    style={{
                        height: `${percentage}%`,
                        backgroundColor: barColor
                    }}
                 />
              </div>

              {i % 6 === 0 && (
                <div className="absolute top-full mt-1 text-[10px] text-slate-500 w-full text-center">
                    {i === 0 ? '12am' : i === 12 ? '12pm' : `${i > 12 ? i-12 : i}${i > 11 ? 'pm' : 'am'}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium">
        {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center text-slate-300 bg-slate-900/50 px-2 py-1 rounded border border-slate-700">
                <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                ></span>
                {item.label}
            </div>
        ))}
      </div>
    </div>
  );
};

export default UsageEditor;
