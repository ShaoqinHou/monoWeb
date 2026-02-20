import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillTotals } from '../components/BillTotals';

describe('BillTotals', () => {
  it('renders subtotal, tax, and total', () => {
    render(<BillTotals subTotal={100} totalTax={15} total={115} />);
    expect(screen.getByTestId('bill-subtotal')).toHaveTextContent('$100.00');
    expect(screen.getByTestId('bill-tax')).toHaveTextContent('$15.00');
    expect(screen.getByTestId('bill-total')).toHaveTextContent('$115.00');
  });

  it('formats with correct currency symbol', () => {
    render(<BillTotals subTotal={200} totalTax={0} total={200} currency="GBP" />);
    expect(screen.getByTestId('bill-subtotal')).toHaveTextContent('£200.00');
    expect(screen.getByTestId('bill-total')).toHaveTextContent('£200.00');
  });

  it('shows zero values correctly', () => {
    render(<BillTotals subTotal={0} totalTax={0} total={0} />);
    expect(screen.getByTestId('bill-subtotal')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('bill-tax')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('bill-total')).toHaveTextContent('$0.00');
  });

  it('does not show amount paid when amountPaid is 0', () => {
    render(<BillTotals subTotal={100} totalTax={15} total={115} amountPaid={0} />);
    expect(screen.queryByTestId('bill-amount-paid')).not.toBeInTheDocument();
  });

  it('shows amount paid and amount due when amountPaid > 0', () => {
    render(
      <BillTotals subTotal={100} totalTax={15} total={115} amountPaid={50} amountDue={65} />,
    );
    expect(screen.getByTestId('bill-amount-paid')).toHaveTextContent('$50.00');
    expect(screen.getByTestId('bill-amount-due')).toHaveTextContent('$65.00');
  });

  it('calculates amount due from total minus amountPaid if amountDue not provided', () => {
    render(
      <BillTotals subTotal={100} totalTax={15} total={115} amountPaid={30} />,
    );
    expect(screen.getByTestId('bill-amount-due')).toHaveTextContent('$85.00');
  });

  it('renders the totals container', () => {
    render(<BillTotals subTotal={100} totalTax={15} total={115} />);
    expect(screen.getByTestId('bill-totals')).toBeInTheDocument();
  });
});
