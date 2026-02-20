// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayslipCard } from '../components/PayslipCard';
import type { Payslip } from '../types';

// Mock the PDF generation
vi.mock('../../../lib/pdf/generatePayslip', () => ({
  generatePayslipPdf: vi.fn(() => ({
    title: 'Test Payslip',
    html: '<html></html>',
    styles: '',
  })),
}));

vi.mock('../../../lib/pdf/generatePdf', () => ({
  downloadPdfAsHtml: vi.fn(),
}));

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const mockPayslip: Payslip = {
  id: 'ps-001',
  employeeId: 'emp-001',
  employeeName: 'Sarah Chen',
  gross: 7916.67,
  paye: 1979.17,
  kiwiSaverEmployee: 237.50,
  kiwiSaverEmployer: 237.50,
  studentLoan: 0,
  totalDeductions: 2216.67,
  net: 5700.00,
};

describe('PayslipCard with Download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payslip card with download button', () => {
    render(<PayslipCard payslip={mockPayslip} />);
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByTestId('download-payslip-emp-001')).toBeInTheDocument();
  });

  it('shows Download button text', () => {
    render(<PayslipCard payslip={mockPayslip} />);
    const btn = screen.getByTestId('download-payslip-emp-001');
    expect(btn.textContent).toContain('Download');
  });

  it('calls downloadPdfAsHtml when download button clicked', async () => {
    const { downloadPdfAsHtml } = await import('../../../lib/pdf/generatePdf');
    const user = userEvent.setup();

    render(<PayslipCard payslip={mockPayslip} payPeriod="Jan 2026" payDate="2026-02-01" />);
    const btn = screen.getByTestId('download-payslip-emp-001');
    await user.click(btn);

    expect(downloadPdfAsHtml).toHaveBeenCalledTimes(1);
  });
});
