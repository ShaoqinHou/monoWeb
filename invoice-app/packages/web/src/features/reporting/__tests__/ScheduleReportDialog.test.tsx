// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleReportDialog } from '../components/ScheduleReportDialog';

vi.mock('lucide-react', () => {
  const icon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    X: icon('X'),
    ChevronDown: icon('ChevronDown'),
    Loader2: icon('Loader2'),
  };
});

describe('ScheduleReportDialog', () => {
  it('does not render when closed', () => {
    render(<ScheduleReportDialog open={false} onClose={vi.fn()} reportName="P&L" />);
    expect(screen.queryByText('Schedule: P&L')).not.toBeInTheDocument();
  });

  it('renders dialog title with report name when open', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Balance Sheet" />);
    expect(screen.getByText('Schedule: Balance Sheet')).toBeInTheDocument();
  });

  it('renders frequency select field', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
  });

  it('renders email input field', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    expect(screen.getByLabelText('Recipient Email')).toBeInTheDocument();
  });

  it('renders format select field', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
  });

  it('renders Cancel and Schedule buttons', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('disables Schedule button when email is empty', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    const scheduleBtn = screen.getByText('Schedule');
    expect(scheduleBtn).toBeDisabled();
  });

  it('enables Schedule button when email is provided', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    const emailInput = screen.getByLabelText('Recipient Email');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    const scheduleBtn = screen.getByText('Schedule');
    expect(scheduleBtn).not.toBeDisabled();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ScheduleReportDialog open={true} onClose={onClose} reportName="Test" />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Schedule is clicked with email', () => {
    const onClose = vi.fn();
    render(<ScheduleReportDialog open={true} onClose={onClose} reportName="Test" />);
    const emailInput = screen.getByLabelText('Recipient Email');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Schedule'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows changing frequency selection', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    const freqSelect = screen.getByLabelText('Frequency');
    fireEvent.change(freqSelect, { target: { value: 'weekly' } });
    expect(freqSelect).toHaveValue('weekly');
  });

  it('allows changing format selection', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    const formatSelect = screen.getByLabelText('Format');
    fireEvent.change(formatSelect, { target: { value: 'csv' } });
    expect(formatSelect).toHaveValue('csv');
  });

  it('defaults frequency to monthly and format to pdf', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="Test" />);
    const freqSelect = screen.getByLabelText('Frequency');
    expect(freqSelect).toHaveValue('monthly');
    const formatSelect = screen.getByLabelText('Format');
    expect(formatSelect).toHaveValue('pdf');
  });
});
