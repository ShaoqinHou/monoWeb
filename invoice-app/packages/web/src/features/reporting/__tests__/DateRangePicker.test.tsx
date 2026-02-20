// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker } from '../components/DateRangePicker';
import type { DateRange } from '../types';

describe('DateRangePicker', () => {
  const defaultRange: DateRange = { from: '2024-01-01', to: '2024-12-31' };

  it('renders the period select', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultRange} onChange={onChange} />);

    expect(screen.getByLabelText('Period')).toBeInTheDocument();
  });

  it('renders all preset options', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultRange} onChange={onChange} />);

    const select = screen.getByLabelText('Period');
    const options = select.querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.textContent);

    expect(labels).toContain('This Month');
    expect(labels).toContain('Last Month');
    expect(labels).toContain('This Quarter');
    expect(labels).toContain('Last Quarter');
    expect(labels).toContain('This Year');
    expect(labels).toContain('Last Year');
    expect(labels).toContain('Custom');
  });

  it('does not show custom date inputs for preset ranges', () => {
    const onChange = vi.fn();
    // Use a range that matches "last-year" preset
    const lastYear: DateRange = {
      from: `${new Date().getFullYear() - 1}-01-01`,
      to: `${new Date().getFullYear() - 1}-12-31`,
    };
    render(<DateRangePicker value={lastYear} onChange={onChange} />);

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('To')).not.toBeInTheDocument();
  });

  it('shows custom date inputs when Custom is selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DateRangePicker value={defaultRange} onChange={onChange} />);

    const select = screen.getByLabelText('Period');
    await user.selectOptions(select, 'custom');

    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('calls onChange with preset range when selecting a preset', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DateRangePicker value={defaultRange} onChange={onChange} />);

    const select = screen.getByLabelText('Period');
    await user.selectOptions(select, 'last-year');

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledWith = onChange.mock.calls[0][0] as DateRange;
    const lastYear = new Date().getFullYear() - 1;
    expect(calledWith.from).toBe(`${lastYear}-01-01`);
    expect(calledWith.to).toBe(`${lastYear}-12-31`);
  });

  it('renders the date-range-picker test id', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value={defaultRange} onChange={onChange} />);

    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('does not call onChange when selecting Custom preset', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DateRangePicker value={defaultRange} onChange={onChange} />);

    const select = screen.getByLabelText('Period');
    await user.selectOptions(select, 'custom');

    // Custom does not immediately update the range
    expect(onChange).not.toHaveBeenCalled();
  });
});
