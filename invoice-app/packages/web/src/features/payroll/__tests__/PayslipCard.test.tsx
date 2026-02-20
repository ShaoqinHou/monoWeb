// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Payslip } from '../types';

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

vi.mock('../../../lib/pdf/generatePayslip', () => ({
  generatePayslipPdf: vi.fn().mockReturnValue('<html>payslip</html>'),
}));

vi.mock('../../../lib/pdf/generatePdf', () => ({
  downloadPdfAsHtml: vi.fn(),
}));

import { PayslipCard } from '../components/PayslipCard';
import { downloadPdfAsHtml } from '../../../lib/pdf/generatePdf';

const SAMPLE_PAYSLIP: Payslip = {
  id: 'ps-001',
  employeeId: 'emp-001',
  employeeName: 'Sarah Chen',
  gross: 7916.67,
  paye: 1583.33,
  kiwiSaverEmployee: 237.50,
  kiwiSaverEmployer: 237.50,
  studentLoan: 0,
  totalDeductions: 1820.83,
  net: 6095.84,
};

const PAYSLIP_WITH_STUDENT_LOAN: Payslip = {
  ...SAMPLE_PAYSLIP,
  id: 'ps-002',
  employeeId: 'emp-002',
  employeeName: 'James Wilson',
  studentLoan: 100.00,
  totalDeductions: 2575.00,
  net: 6591.67,
};

describe('PayslipCard', () => {
  it('renders payslip data-testid', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByTestId('payslip-emp-001')).toBeInTheDocument();
  });

  it('renders employee name', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });

  it('renders net pay in header and detail', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    // Net pay appears both in the header (bold) and in the detail section
    const netPayElements = screen.getAllByText('$6,095.84');
    expect(netPayElements.length).toBe(2);
  });

  it('renders gross pay', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('Gross Pay')).toBeInTheDocument();
    expect(screen.getByText('$7,916.67')).toBeInTheDocument();
  });

  it('renders PAYE deduction', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('PAYE')).toBeInTheDocument();
    expect(screen.getByText('-$1,583.33')).toBeInTheDocument();
  });

  it('renders KiwiSaver (Employee) deduction', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('KiwiSaver (Employee)')).toBeInTheDocument();
    expect(screen.getByText('-$237.50')).toBeInTheDocument();
  });

  it('renders KiwiSaver (Employer) when > 0', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('KiwiSaver (Employer)')).toBeInTheDocument();
  });

  it('renders Student Loan when > 0', () => {
    render(<PayslipCard payslip={PAYSLIP_WITH_STUDENT_LOAN} />);
    expect(screen.getByText('Student Loan')).toBeInTheDocument();
  });

  it('does not render Student Loan when 0', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.queryByText('Student Loan')).not.toBeInTheDocument();
  });

  it('renders Total Deductions', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('Total Deductions')).toBeInTheDocument();
    expect(screen.getByText('-$1,820.83')).toBeInTheDocument();
  });

  it('renders Net Pay label', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByText('Net Pay')).toBeInTheDocument();
  });

  it('renders Download button', () => {
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);
    expect(screen.getByTestId('download-payslip-emp-001')).toBeInTheDocument();
  });

  it('calls download when Download button is clicked', async () => {
    const user = userEvent.setup();
    render(<PayslipCard payslip={SAMPLE_PAYSLIP} />);

    await user.click(screen.getByTestId('download-payslip-emp-001'));
    expect(downloadPdfAsHtml).toHaveBeenCalled();
  });
});
