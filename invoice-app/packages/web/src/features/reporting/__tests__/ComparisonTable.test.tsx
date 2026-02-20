// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from '../components/ComparisonTable';
import type { ReportSection } from '../types';

const currentSections: ReportSection[] = [
  {
    rows: [
      { label: 'Revenue', type: 'header' },
      { label: 'Sales', amount: 10000, type: 'item' },
      { label: 'Total Revenue', amount: 10000, type: 'total' },
    ],
  },
];

const priorSections: ReportSection[] = [
  {
    rows: [
      { label: 'Revenue', type: 'header' },
      { label: 'Sales', amount: 8500, type: 'item' },
      { label: 'Total Revenue', amount: 8500, type: 'total' },
    ],
  },
];

describe('ComparisonTable', () => {
  it('renders the comparison table with all column headers', () => {
    render(<ComparisonTable currentSections={currentSections} priorSections={priorSections} />);
    expect(screen.getByText('This Period')).toBeInTheDocument();
    expect(screen.getByText('Prior Period')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
    expect(screen.getByText('Change %')).toBeInTheDocument();
  });

  it('renders row labels', () => {
    render(<ComparisonTable currentSections={currentSections} priorSections={priorSections} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('displays current and prior amounts', () => {
    render(<ComparisonTable currentSections={currentSections} priorSections={priorSections} />);
    // Current: $10,000.00, Prior: $8,500.00
    expect(screen.getAllByText('$10,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$8,500.00').length).toBeGreaterThan(0);
  });

  it('displays change values', () => {
    render(<ComparisonTable currentSections={currentSections} priorSections={priorSections} />);
    // Change: $1,500.00 for Sales and Total Revenue rows
    expect(screen.getAllByText('$1,500.00').length).toBeGreaterThan(0);
  });

  it('displays change percentage', () => {
    render(<ComparisonTable currentSections={currentSections} priorSections={priorSections} />);
    // 1500/8500 = 17.6%
    expect(screen.getAllByText('+17.6%').length).toBeGreaterThan(0);
  });
});
