// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CashFlowForecast, type CashFlowPeriod } from '../components/CashFlowForecast';

const SAMPLE_PERIODS: CashFlowPeriod[] = [
  { label: 'Week 1', receivables: 5000, payables: 3000, netFlow: 2000, runningBalance: 12000 },
  { label: 'Week 2', receivables: 3000, payables: 4000, netFlow: -1000, runningBalance: 11000 },
  { label: 'Week 3', receivables: 8000, payables: 2000, netFlow: 6000, runningBalance: 17000 },
  { label: 'Week 4', receivables: 4000, payables: 5000, netFlow: -1000, runningBalance: 16000 },
];

describe('CashFlowForecast', () => {
  it('renders table headers', () => {
    render(
      <CashFlowForecast
        periods={SAMPLE_PERIODS}
        openingBalance={10000}
        closingBalance={16000}
      />,
    );

    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Receivables (In)')).toBeInTheDocument();
    expect(screen.getByText('Payables (Out)')).toBeInTheDocument();
    expect(screen.getByText('Net Flow')).toBeInTheDocument();
    expect(screen.getByText('Running Balance')).toBeInTheDocument();
  });

  it('renders all periods', () => {
    render(
      <CashFlowForecast
        periods={SAMPLE_PERIODS}
        openingBalance={10000}
        closingBalance={16000}
      />,
    );

    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    expect(screen.getByText('Week 4')).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    render(
      <CashFlowForecast
        periods={SAMPLE_PERIODS}
        openingBalance={10000}
        closingBalance={16000}
      />,
    );

    expect(screen.getByText('Opening Balance')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Projected Closing')).toBeInTheDocument();
  });

  it('renders total row', () => {
    render(
      <CashFlowForecast
        periods={SAMPLE_PERIODS}
        openingBalance={10000}
        closingBalance={16000}
      />,
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders empty state when no periods', () => {
    render(
      <CashFlowForecast
        periods={[]}
        openingBalance={10000}
        closingBalance={10000}
      />,
    );

    expect(screen.getByText('No forecast data available')).toBeInTheDocument();
  });

  it('renders data-testid for the container', () => {
    render(
      <CashFlowForecast
        periods={[]}
        openingBalance={0}
        closingBalance={0}
      />,
    );

    expect(screen.getByTestId('cash-flow-forecast')).toBeInTheDocument();
  });

  it('renders opening balance value', () => {
    render(
      <CashFlowForecast
        periods={SAMPLE_PERIODS}
        openingBalance={10000}
        closingBalance={16000}
      />,
    );

    // Opening balance is shown in the summary card
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('renders closing balance value', () => {
    render(
      <CashFlowForecast
        periods={SAMPLE_PERIODS}
        openingBalance={10000}
        closingBalance={16000}
      />,
    );

    // Closing balance appears in summary card and in the total row
    const closingElements = screen.getAllByText('$16,000.00');
    expect(closingElements.length).toBeGreaterThan(0);
  });
});
