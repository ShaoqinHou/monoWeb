// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getESCTRate, KIWISAVER_EMPLOYEE_RATES, KIWISAVER_EMPLOYER_RATE } from '../hooks/useKiwiSaver';
import { getTaxYearOptions } from '../hooks/useYearEndSummary';

describe('getESCTRate', () => {
  it('returns 10.5% for salary <= 16800', () => {
    expect(getESCTRate(16800)).toBe(10.5);
    expect(getESCTRate(10000)).toBe(10.5);
  });

  it('returns 17.5% for salary 16801-57600', () => {
    expect(getESCTRate(16801)).toBe(17.5);
    expect(getESCTRate(57600)).toBe(17.5);
  });

  it('returns 30% for salary 57601-84000', () => {
    expect(getESCTRate(57601)).toBe(30);
    expect(getESCTRate(84000)).toBe(30);
  });

  it('returns 33% for salary 84001-180000', () => {
    expect(getESCTRate(84001)).toBe(33);
    expect(getESCTRate(180000)).toBe(33);
    expect(getESCTRate(95000)).toBe(33);
  });

  it('returns 39% for salary > 180000', () => {
    expect(getESCTRate(180001)).toBe(39);
    expect(getESCTRate(250000)).toBe(39);
  });
});

describe('KIWISAVER_EMPLOYEE_RATES', () => {
  it('contains expected rates', () => {
    expect(KIWISAVER_EMPLOYEE_RATES).toEqual([3, 4, 6, 8, 10]);
  });
});

describe('KIWISAVER_EMPLOYER_RATE', () => {
  it('is fixed at 3%', () => {
    expect(KIWISAVER_EMPLOYER_RATE).toBe(3);
  });
});

describe('getTaxYearOptions', () => {
  it('returns 5 tax year options', () => {
    const options = getTaxYearOptions();
    expect(options).toHaveLength(5);
  });

  it('each option has value and label', () => {
    const options = getTaxYearOptions();
    for (const opt of options) {
      expect(typeof opt.value).toBe('string');
      expect(opt.label).toContain('Apr');
      expect(opt.label).toContain('Mar');
    }
  });

  it('years are in descending order', () => {
    const options = getTaxYearOptions();
    const years = options.map((o) => parseInt(o.value, 10));
    for (let i = 0; i < years.length - 1; i++) {
      expect(years[i]).toBeGreaterThan(years[i + 1]);
    }
  });
});
