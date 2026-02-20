// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayrollReportViewer } from '../components/PayrollReportViewer';
import type { PayrollReportData } from '../hooks/usePayrollReports';

const SAMPLE_REPORT: PayrollReportData = {
  type: 'payroll-activity',
  title: 'Payroll Activity Summary',
  columns: ['Employee', 'Gross', 'PAYE', 'KiwiSaver', 'Net'],
  rows: [
    ['Sarah Chen', '$7,916.67', '$1,583.33', '$237.50', '$6,095.84'],
    ['James Wilson', '$9,166.67', '$2,200.00', '$275.00', '$6,591.67'],
  ],
};

const EMPTY_REPORT: PayrollReportData = {
  type: 'leave-balances',
  title: 'Leave Balances',
  columns: ['Employee', 'Annual', 'Sick', 'Bereavement'],
  rows: [],
};

describe('PayrollReportViewer', () => {
  it('renders data-testid', () => {
    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    expect(screen.getByTestId('payroll-report-viewer')).toBeInTheDocument();
  });

  it('renders report title', () => {
    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    expect(screen.getByText('Payroll Activity Summary')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Gross')).toBeInTheDocument();
    expect(screen.getByText('PAYE')).toBeInTheDocument();
    expect(screen.getByText('KiwiSaver')).toBeInTheDocument();
    expect(screen.getByText('Net')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('James Wilson')).toBeInTheDocument();
    expect(screen.getByText('$7,916.67')).toBeInTheDocument();
    expect(screen.getByText('$9,166.67')).toBeInTheDocument();
  });

  it('renders Export CSV button', () => {
    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('renders Print button', () => {
    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('renders "No data available" when rows are empty', () => {
    render(<PayrollReportViewer report={EMPTY_REPORT} />);
    expect(screen.getByText('No data available for this report')).toBeInTheDocument();
  });

  it('calls exportCSV when Export CSV button clicked', async () => {
    const user = userEvent.setup();
    // Mock URL and document.createElement
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.fn();
    const clickSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const el = originalCreateElement('a');
        el.click = clickSpy;
        return el;
      }
      return originalCreateElement(tag);
    });

    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    await user.click(screen.getByTestId('export-csv-btn'));

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('calls window.print when Print button clicked', async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);

    render(<PayrollReportViewer report={SAMPLE_REPORT} />);
    await user.click(screen.getByTestId('print-btn'));

    expect(printSpy).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
