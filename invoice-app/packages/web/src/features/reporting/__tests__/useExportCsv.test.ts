// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportSectionsToCsv, agedReportToCsv, downloadCsv } from '../hooks/useExportCsv';
import type { ReportSection } from '../types';

describe('CSV Export', () => {
  describe('reportSectionsToCsv', () => {
    it('generates CSV header row', () => {
      const csv = reportSectionsToCsv([]);
      expect(csv).toBe('Label,Amount');
    });

    it('generates rows for each report section item', () => {
      const sections: ReportSection[] = [
        {
          rows: [
            { label: 'Revenue', type: 'header' },
            { label: 'Sales', amount: 10000, type: 'item' },
            { label: 'Total Revenue', amount: 10000, type: 'total' },
          ],
        },
      ];
      const csv = reportSectionsToCsv(sections);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe('Label,Amount');
      expect(lines[1]).toBe('Revenue,');
      expect(lines[2]).toBe('Sales,10000.00');
      expect(lines[3]).toBe('Total Revenue,10000.00');
    });

    it('escapes labels containing commas', () => {
      const sections: ReportSection[] = [
        {
          rows: [
            { label: 'Sales, domestic', amount: 5000, type: 'item' },
          ],
        },
      ];
      const csv = reportSectionsToCsv(sections);
      expect(csv).toContain('"Sales, domestic"');
    });

    it('escapes labels containing quotes', () => {
      const sections: ReportSection[] = [
        {
          rows: [
            { label: 'Account "Primary"', amount: 3000, type: 'item' },
          ],
        },
      ];
      const csv = reportSectionsToCsv(sections);
      expect(csv).toContain('"Account ""Primary"""');
    });

    it('handles multiple sections', () => {
      const sections: ReportSection[] = [
        {
          rows: [
            { label: 'Income', type: 'header' },
            { label: 'Sales', amount: 5000, type: 'item' },
          ],
        },
        {
          rows: [
            { label: 'Expenses', type: 'header' },
            { label: 'Rent', amount: 1000, type: 'item' },
          ],
        },
      ];
      const csv = reportSectionsToCsv(sections);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(5); // header + 4 data rows
    });
  });

  describe('agedReportToCsv', () => {
    it('generates CSV with bucket data and total', () => {
      const buckets = [
        { label: 'Current', amount: 5000, count: 3 },
        { label: '1-30 days', amount: 2000, count: 2 },
      ];
      const csv = agedReportToCsv(buckets, 7000);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Bucket,Amount,Count');
      expect(lines[1]).toBe('Current,5000.00,3');
      expect(lines[2]).toBe('1-30 days,2000.00,2');
      expect(lines[3]).toBe('Total,7000.00,');
    });
  });

  describe('downloadCsv', () => {
    let createObjectURLSpy: ReturnType<typeof vi.fn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      createObjectURLSpy = vi.fn().mockReturnValue('blob:test');
      revokeObjectURLSpy = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLSpy as unknown as typeof URL.createObjectURL;
      globalThis.URL.revokeObjectURL = revokeObjectURLSpy as unknown as typeof URL.revokeObjectURL;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates a Blob URL, appends a link, clicks it, and cleans up', () => {
      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        // Spy on click before it's called
        if (node instanceof HTMLAnchorElement) {
          node.click = clickSpy;
        }
        return node;
      });
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      downloadCsv('test,data\n1,2', 'test.csv');

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      expect(appendSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
