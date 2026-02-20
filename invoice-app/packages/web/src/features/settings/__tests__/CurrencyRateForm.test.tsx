// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyRateForm } from '../components/CurrencyRateForm';
import type { CurrencyEntry } from '../hooks/useCurrencies';

const NZD_CURRENCY: CurrencyEntry = {
  code: 'NZD',
  name: 'New Zealand Dollar',
  rate: 1,
  enabled: true,
};

const USD_CURRENCY: CurrencyEntry = {
  code: 'USD',
  name: 'US Dollar',
  rate: 0.62,
  enabled: true,
};

const AUD_CURRENCY: CurrencyEntry = {
  code: 'AUD',
  name: 'Australian Dollar',
  rate: 0.93,
  enabled: false,
};

describe('CurrencyRateForm', () => {
  it('renders currency code', () => {
    render(<CurrencyRateForm currency={USD_CURRENCY} onChange={vi.fn()} />);
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('renders currency name', () => {
    render(<CurrencyRateForm currency={USD_CURRENCY} onChange={vi.fn()} />);
    expect(screen.getByText('US Dollar')).toBeInTheDocument();
  });

  it('renders data-testid with currency code', () => {
    render(<CurrencyRateForm currency={USD_CURRENCY} onChange={vi.fn()} />);
    expect(screen.getByTestId('currency-row-USD')).toBeInTheDocument();
  });

  it('renders rate input with current value', () => {
    render(<CurrencyRateForm currency={USD_CURRENCY} onChange={vi.fn()} />);
    const input = screen.getByLabelText('Exchange rate for USD');
    expect(input).toHaveValue(0.62);
  });

  it('calls onChange when rate changes', () => {
    const onChange = vi.fn();
    render(<CurrencyRateForm currency={USD_CURRENCY} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Exchange rate for USD'), { target: { value: '0.65' } });
    expect(onChange).toHaveBeenCalledWith('USD', 0.65);
  });

  it('disables rate input for NZD (base currency)', () => {
    render(<CurrencyRateForm currency={NZD_CURRENCY} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Exchange rate for NZD')).toBeDisabled();
  });

  it('enables rate input for non-NZD currencies', () => {
    render(<CurrencyRateForm currency={AUD_CURRENCY} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Exchange rate for AUD')).not.toBeDisabled();
  });
});
