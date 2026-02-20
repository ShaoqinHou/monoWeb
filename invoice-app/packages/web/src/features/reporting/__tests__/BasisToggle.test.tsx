// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BasisToggle } from '../components/BasisToggle';
import type { AccountingBasis } from '../components/BasisToggle';

describe('BasisToggle', () => {
  it('renders Accrual and Cash buttons', () => {
    render(<BasisToggle basis="accrual" onChange={vi.fn()} />);
    expect(screen.getByText('Accrual')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('renders as a radiogroup with accessible label', () => {
    render(<BasisToggle basis="accrual" onChange={vi.fn()} />);
    const group = screen.getByRole('radiogroup', { name: 'Accounting basis' });
    expect(group).toBeInTheDocument();
  });

  it('marks accrual as checked when basis is accrual', () => {
    render(<BasisToggle basis="accrual" onChange={vi.fn()} />);
    const accrualBtn = screen.getByRole('radio', { name: 'Accrual' });
    expect(accrualBtn).toHaveAttribute('aria-checked', 'true');
    const cashBtn = screen.getByRole('radio', { name: 'Cash' });
    expect(cashBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('marks cash as checked when basis is cash', () => {
    render(<BasisToggle basis="cash" onChange={vi.fn()} />);
    const accrualBtn = screen.getByRole('radio', { name: 'Accrual' });
    expect(accrualBtn).toHaveAttribute('aria-checked', 'false');
    const cashBtn = screen.getByRole('radio', { name: 'Cash' });
    expect(cashBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with "cash" when Cash button is clicked', () => {
    const onChange = vi.fn();
    render(<BasisToggle basis="accrual" onChange={onChange} />);
    fireEvent.click(screen.getByText('Cash'));
    expect(onChange).toHaveBeenCalledWith('cash');
  });

  it('calls onChange with "accrual" when Accrual button is clicked', () => {
    const onChange = vi.fn();
    render(<BasisToggle basis="cash" onChange={onChange} />);
    fireEvent.click(screen.getByText('Accrual'));
    expect(onChange).toHaveBeenCalledWith('accrual');
  });

  it('applies active styling to the selected button', () => {
    render(<BasisToggle basis="accrual" onChange={vi.fn()} />);
    const accrualBtn = screen.getByText('Accrual');
    expect(accrualBtn.className).toContain('bg-blue-600');
    expect(accrualBtn.className).toContain('text-white');
    const cashBtn = screen.getByText('Cash');
    expect(cashBtn.className).toContain('bg-white');
    expect(cashBtn.className).toContain('text-gray-700');
  });

  it('renders with data-testid for targeting', () => {
    render(<BasisToggle basis="accrual" onChange={vi.fn()} />);
    expect(screen.getByTestId('basis-toggle')).toBeInTheDocument();
  });

  it('calls onChange even when clicking already selected basis', () => {
    const onChange = vi.fn();
    render(<BasisToggle basis="accrual" onChange={onChange} />);
    fireEvent.click(screen.getByText('Accrual'));
    expect(onChange).toHaveBeenCalledWith('accrual');
  });
});
