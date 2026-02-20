// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewPayRunForm } from '../components/NewPayRunForm';

/** Helper: find the input within a label's parent container */
function getInputByLabel(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  const container = label.closest('.flex.flex-col')!;
  return container.querySelector('input')! as HTMLInputElement;
}

describe('NewPayRunForm', () => {
  it('renders form with data-testid', () => {
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('new-pay-run-form')).toBeInTheDocument();
  });

  it('renders all date field labels', () => {
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Period Start')).toBeInTheDocument();
    expect(screen.getByText('Period End')).toBeInTheDocument();
    expect(screen.getByText('Pay Date')).toBeInTheDocument();
  });

  it('renders info box about auto-generated payslips', () => {
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Auto-generated payslips')).toBeInTheDocument();
    expect(screen.getByText(/All active employees will be included/)).toBeInTheDocument();
  });

  it('disables submit when fields are empty', () => {
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Create Pay Run' })).toBeDisabled();
  });

  it('enables submit when all fields are filled', () => {
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(getInputByLabel('Period Start'), { target: { value: '2026-03-01' } });
    fireEvent.change(getInputByLabel('Period End'), { target: { value: '2026-03-31' } });
    fireEvent.change(getInputByLabel('Pay Date'), { target: { value: '2026-04-01' } });

    expect(screen.getByRole('button', { name: 'Create Pay Run' })).not.toBeDisabled();
  });

  it('calls onSubmit with date fields on form submit', () => {
    const onSubmit = vi.fn();
    render(<NewPayRunForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(getInputByLabel('Period Start'), { target: { value: '2026-03-01' } });
    fireEvent.change(getInputByLabel('Period End'), { target: { value: '2026-03-31' } });
    fireEvent.change(getInputByLabel('Pay Date'), { target: { value: '2026-04-01' } });

    fireEvent.submit(screen.getByTestId('new-pay-run-form'));

    expect(onSubmit).toHaveBeenCalledWith({
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      payDate: '2026-04-01',
    });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(<NewPayRunForm onSubmit={vi.fn()} onCancel={vi.fn()} loading />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
