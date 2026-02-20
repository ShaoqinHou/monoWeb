// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodCompareToggle } from '../components/PeriodCompareToggle';

describe('PeriodCompareToggle', () => {
  it('renders the compare checkbox', () => {
    render(<PeriodCompareToggle enabled={false} onChange={vi.fn()} />);
    expect(screen.getByTestId('compare-checkbox')).toBeInTheDocument();
  });

  it('calls onChange when checkbox is toggled', () => {
    const onChange = vi.fn();
    render(<PeriodCompareToggle enabled={false} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('compare-checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not show mode select when disabled', () => {
    render(<PeriodCompareToggle enabled={false} onChange={vi.fn()} />);
    expect(screen.queryByTestId('compare-mode-select')).not.toBeInTheDocument();
  });

  it('shows mode select when enabled', () => {
    render(<PeriodCompareToggle enabled={true} onChange={vi.fn()} />);
    expect(screen.getByTestId('compare-mode-select')).toBeInTheDocument();
  });

  it('calls onCompareModeChange when mode is changed', () => {
    const onModeChange = vi.fn();
    render(
      <PeriodCompareToggle
        enabled={true}
        onChange={vi.fn()}
        compareMode="prior-period"
        onCompareModeChange={onModeChange}
      />,
    );
    fireEvent.change(screen.getByTestId('compare-mode-select'), {
      target: { value: 'same-period-last-year' },
    });
    expect(onModeChange).toHaveBeenCalledWith('same-period-last-year');
  });
});
