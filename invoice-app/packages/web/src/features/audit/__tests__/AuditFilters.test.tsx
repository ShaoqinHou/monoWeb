// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditFilters } from '../components/AuditFilters';

const defaultProps = {
  entityType: '',
  action: '',
  dateRange: { start: '', end: '' },
  onEntityTypeChange: vi.fn(),
  onActionChange: vi.fn(),
  onDateRangeChange: vi.fn(),
  onClear: vi.fn(),
};

describe('AuditFilters', () => {
  it('renders entity type dropdown', () => {
    render(<AuditFilters {...defaultProps} />);
    expect(screen.getByTestId('filter-entity-type')).toBeInTheDocument();
  });

  it('renders action dropdown', () => {
    render(<AuditFilters {...defaultProps} />);
    expect(screen.getByTestId('filter-action')).toBeInTheDocument();
  });

  it('renders date range inputs', () => {
    render(<AuditFilters {...defaultProps} />);
    expect(screen.getByTestId('filter-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('filter-end-date')).toBeInTheDocument();
  });

  it('renders clear filters button', () => {
    render(<AuditFilters {...defaultProps} />);
    expect(screen.getByTestId('clear-filters-btn')).toBeInTheDocument();
  });

  it('calls onEntityTypeChange when entity type dropdown changes', () => {
    const handler = vi.fn();
    render(<AuditFilters {...defaultProps} onEntityTypeChange={handler} />);

    fireEvent.change(screen.getByTestId('filter-entity-type'), { target: { value: 'invoice' } });
    expect(handler).toHaveBeenCalledWith('invoice');
  });

  it('calls onActionChange when action dropdown changes', () => {
    const handler = vi.fn();
    render(<AuditFilters {...defaultProps} onActionChange={handler} />);

    fireEvent.change(screen.getByTestId('filter-action'), { target: { value: 'created' } });
    expect(handler).toHaveBeenCalledWith('created');
  });

  it('calls onDateRangeChange when start date changes', () => {
    const handler = vi.fn();
    render(<AuditFilters {...defaultProps} onDateRangeChange={handler} />);

    fireEvent.change(screen.getByTestId('filter-start-date'), { target: { value: '2026-02-01' } });
    expect(handler).toHaveBeenCalledWith({ start: '2026-02-01', end: '' });
  });

  it('calls onDateRangeChange when end date changes', () => {
    const handler = vi.fn();
    render(<AuditFilters {...defaultProps} dateRange={{ start: '2026-02-01', end: '' }} onDateRangeChange={handler} />);

    fireEvent.change(screen.getByTestId('filter-end-date'), { target: { value: '2026-02-28' } });
    expect(handler).toHaveBeenCalledWith({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('calls onClear when clear button clicked', () => {
    const handler = vi.fn();
    render(<AuditFilters {...defaultProps} onClear={handler} />);

    fireEvent.click(screen.getByTestId('clear-filters-btn'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows entity type options including all types', () => {
    render(<AuditFilters {...defaultProps} />);
    const select = screen.getByTestId('filter-entity-type') as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.value);

    expect(options).toContain('');
    expect(options).toContain('invoice');
    expect(options).toContain('bill');
    expect(options).toContain('contact');
    expect(options).toContain('quote');
  });

  it('shows action options including all actions', () => {
    render(<AuditFilters {...defaultProps} />);
    const select = screen.getByTestId('filter-action') as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.value);

    expect(options).toContain('');
    expect(options).toContain('created');
    expect(options).toContain('updated');
    expect(options).toContain('deleted');
    expect(options).toContain('status_changed');
  });
});
