// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('../../accounting/hooks/useTaxRates', () => ({
  useTaxRates: () => ({ data: undefined }),
}));

vi.mock('../../accounting/hooks/useAccounts', () => ({
  useAccounts: () => ({ data: undefined }),
}));

import { ExpenseForm } from '../components/ExpenseForm';

describe('Mileage Claims on Expenses', () => {
  it('renders mileage toggle checkbox', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('mileage-toggle')).toBeInTheDocument();
  });

  it('shows mileage fields with rate dropdown when toggled', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    const toggle = screen.getByTestId('mileage-toggle').querySelector('input')!;
    fireEvent.click(toggle);
    expect(screen.getByTestId('mileage-fields')).toBeInTheDocument();
    expect(screen.getByTestId('expense-mileage-km')).toBeInTheDocument();
    expect(screen.getByTestId('expense-mileage-rate-select')).toBeInTheDocument();
  });

  it('auto-calculates amount from mileage km x rate', async () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    // Toggle mileage on
    const toggle = screen.getByTestId('mileage-toggle').querySelector('input')!;
    fireEvent.click(toggle);

    // Enter 50 km at default rate 0.95
    await act(async () => {
      fireEvent.change(screen.getByTestId('expense-mileage-km'), { target: { value: '50' } });
    });

    // Amount should be auto-calculated: 50 * 0.95 = 47.5
    expect(screen.getByTestId('mileage-calc-amount')).toHaveTextContent('50 km x $0.95/km = $47.50');
    // The amount input should reflect calculated value
    expect((screen.getByTestId('expense-amount') as HTMLInputElement).value).toBe('47.5');
  });

  it('shows mileage rate select with NZ standard rate', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    const toggle = screen.getByTestId('mileage-toggle').querySelector('input')!;
    fireEvent.click(toggle);
    const rateSelect = screen.getByTestId('expense-mileage-rate-select') as HTMLSelectElement;
    expect(rateSelect.value).toBe('0.95');
  });

  it('includes mileage data in submitted form data', async () => {
    const onSubmit = vi.fn();
    render(<ExpenseForm onSubmit={onSubmit} />);

    // Toggle mileage on
    const toggle = screen.getByTestId('mileage-toggle').querySelector('input')!;
    fireEvent.click(toggle);

    // Fill fields
    fireEvent.change(screen.getByTestId('expense-description'), { target: { value: 'Travel to client' } });
    await act(async () => {
      fireEvent.change(screen.getByTestId('expense-mileage-km'), { target: { value: '100' } });
    });

    // Submit
    fireEvent.click(screen.getByTestId('expense-submit-button'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0];
    expect(data.mileageKm).toBe(100);
    expect(data.mileageRate).toBe(0.95);
    expect(data.amount).toBe(95); // 100 * 0.95
  });
});
