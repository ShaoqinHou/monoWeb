import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayRunDetail } from '../components/PayRunDetail';
import type { PayRun, Payslip } from '../types';

const SAMPLE_PAYSLIPS: Payslip[] = [
  {
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
  },
  {
    id: 'ps-002',
    employeeId: 'emp-002',
    employeeName: 'James Wilson',
    gross: 9166.67,
    paye: 2200.00,
    kiwiSaverEmployee: 275.00,
    kiwiSaverEmployer: 275.00,
    studentLoan: 100.00,
    totalDeductions: 2575.00,
    net: 6591.67,
  },
];

const DRAFT_PAY_RUN: PayRun = {
  id: 'pr-003',
  periodStart: '2026-02-01',
  periodEnd: '2026-02-28',
  payDate: '2026-03-01',
  status: 'draft',
  employees: [
    { employeeId: 'emp-001', employeeName: 'Sarah Chen', gross: 7916.67, tax: 1820.83, net: 6095.84 },
    { employeeId: 'emp-002', employeeName: 'James Wilson', gross: 9166.67, tax: 2575.00, net: 6591.67 },
  ],
  payslips: SAMPLE_PAYSLIPS,
  totalGross: 17083.34,
  totalTax: 4395.83,
  totalNet: 12687.51,
};

const POSTED_PAY_RUN: PayRun = {
  ...DRAFT_PAY_RUN,
  status: 'posted',
};

describe('PayRunDetail', () => {
  it('renders pay run period and pay date', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);
    expect(screen.getByTestId('pay-run-detail')).toBeInTheDocument();
    // The heading shows the period
    expect(screen.getByText(/Pay Run:/)).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders total summary cards', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);
    expect(screen.getByText('Total Gross')).toBeInTheDocument();
    expect(screen.getByText('Total Tax/Deductions')).toBeInTheDocument();
    expect(screen.getByText('Total Net')).toBeInTheDocument();
  });

  it('renders "Post Pay Run" button for draft status', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Post Pay Run' })).toBeInTheDocument();
  });

  it('does not render "Post Pay Run" button for posted status', () => {
    render(<PayRunDetail payRun={POSTED_PAY_RUN} onPost={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Post Pay Run' })).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when Post button clicked', async () => {
    const user = userEvent.setup();
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Post Pay Run' }));
    expect(screen.getByText('Confirm Post')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to post this pay run/)).toBeInTheDocument();
  });

  it('calls onPost when confirmation dialog confirmed', async () => {
    const user = userEvent.setup();
    const onPost = vi.fn();
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={onPost} />);

    await user.click(screen.getByRole('button', { name: 'Post Pay Run' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Post' }));
    expect(onPost).toHaveBeenCalledTimes(1);
  });

  it('renders payslips with PAYE and KiwiSaver breakdown', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);

    // Check for employee payslip cards
    expect(screen.getByTestId('payslip-emp-001')).toBeInTheDocument();
    expect(screen.getByTestId('payslip-emp-002')).toBeInTheDocument();

    // Check for PAYE deduction labels
    const payeLabels = screen.getAllByText('PAYE');
    expect(payeLabels.length).toBeGreaterThanOrEqual(2);

    // Check for KiwiSaver labels
    const ksLabels = screen.getAllByText('KiwiSaver (Employee)');
    expect(ksLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('renders student loan deduction when present', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);

    // James Wilson has a student loan deduction
    const studentLoanLabels = screen.getAllByText('Student Loan');
    expect(studentLoanLabels.length).toBeGreaterThan(0);
  });

  it('renders payslip count', () => {
    render(<PayRunDetail payRun={DRAFT_PAY_RUN} onPost={vi.fn()} />);
    expect(screen.getByText('Payslips (2)')).toBeInTheDocument();
  });
});
