// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { computeChange, computePriorRange } from '../hooks/useReportComparison';
import type { DateRange } from '../types';

describe('useReportComparison', () => {
  describe('computePriorRange', () => {
    it('computes prior period by shifting back by range duration', () => {
      const range: DateRange = { from: '2026-04-01', to: '2026-06-30' };
      const prior = computePriorRange(range, 'prior-period');
      // Duration is ~91 days, prior should end on March 31 and go back ~91 days
      expect(prior.to).toBe('2026-03-31');
      // The prior.from should be approximately 91 days before the to
      const priorFromDate = new Date(prior.from + 'T00:00:00');
      const priorToDate = new Date(prior.to + 'T00:00:00');
      const durationDays = (priorToDate.getTime() - priorFromDate.getTime()) / (1000 * 60 * 60 * 24);
      // Should be about same duration as original range
      expect(durationDays).toBeGreaterThanOrEqual(89);
      expect(durationDays).toBeLessThanOrEqual(92);
    });

    it('computes same period last year', () => {
      const range: DateRange = { from: '2026-01-01', to: '2026-12-31' };
      const prior = computePriorRange(range, 'same-period-last-year');
      expect(prior.from).toBe('2025-01-01');
      expect(prior.to).toBe('2025-12-31');
    });

    it('computes same period last year for a single month', () => {
      const range: DateRange = { from: '2026-03-01', to: '2026-03-31' };
      const prior = computePriorRange(range, 'same-period-last-year');
      expect(prior.from).toBe('2025-03-01');
      expect(prior.to).toBe('2025-03-31');
    });
  });

  describe('computeChange', () => {
    it('computes positive change', () => {
      const result = computeChange(120, 100);
      expect(result.change).toBe(20);
      expect(result.changePercent).toBeCloseTo(20.0);
    });

    it('computes negative change', () => {
      const result = computeChange(80, 100);
      expect(result.change).toBe(-20);
      expect(result.changePercent).toBeCloseTo(-20.0);
    });

    it('returns null percent when prior is zero', () => {
      const result = computeChange(100, 0);
      expect(result.change).toBe(100);
      expect(result.changePercent).toBeNull();
    });

    it('returns zero change when values are equal', () => {
      const result = computeChange(100, 100);
      expect(result.change).toBe(0);
      expect(result.changePercent).toBeCloseTo(0);
    });
  });
});
