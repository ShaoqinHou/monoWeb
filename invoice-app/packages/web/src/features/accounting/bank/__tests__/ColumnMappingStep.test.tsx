// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnMappingStep } from '../components/ColumnMappingStep';
import type { CsvColumnMapping } from '../components/CsvParser';

const sampleHeaders = ['Transaction Date', 'Memo', 'Amount', 'Reference Number'];
const sampleRows = [
  ['2026-01-15', 'Payment from Client', '1500.00', 'REF001'],
  ['2026-01-16', 'Office rent', '-2000.00', 'REF002'],
  ['2026-01-17', 'Supplies', '-350.00', 'REF003'],
];

const defaultMapping: CsvColumnMapping = {
  date: 0,
  description: 1,
  amount: 2,
};

describe('ColumnMappingStep', () => {
  it('renders column dropdowns for required fields', () => {
    render(
      <ColumnMappingStep
        headers={sampleHeaders}
        sampleRows={sampleRows}
        mapping={defaultMapping}
        onMappingChange={() => {}}
      />,
    );
    // Should have dropdowns for Date, Description, Amount at minimum
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
  });

  it('auto-detects common header names and reflects in mapping', () => {
    const headers = ['Date', 'Description', 'Amount', 'Reference'];
    const onChange = vi.fn();
    render(
      <ColumnMappingStep
        headers={headers}
        sampleRows={sampleRows}
        mapping={{ date: 0, description: 1, amount: 2, reference: 3 }}
        onMappingChange={onChange}
      />,
    );
    // The Date dropdown should show column 0 selected (index 0)
    const dateSelect = screen.getByLabelText(/date/i) as HTMLSelectElement;
    expect(dateSelect.value).toBe('0');
  });

  it('shows preview rows in a table', () => {
    render(
      <ColumnMappingStep
        headers={sampleHeaders}
        sampleRows={sampleRows}
        mapping={defaultMapping}
        onMappingChange={() => {}}
      />,
    );
    // Should show at least the first sample row data
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    expect(screen.getByText('Payment from Client')).toBeInTheDocument();
    expect(screen.getByText('1500.00')).toBeInTheDocument();
  });

  it('calls onMappingChange when a dropdown changes', () => {
    const onChange = vi.fn();
    render(
      <ColumnMappingStep
        headers={sampleHeaders}
        sampleRows={sampleRows}
        mapping={defaultMapping}
        onMappingChange={onChange}
      />,
    );
    const dateSelect = screen.getByLabelText(/date/i);
    fireEvent.change(dateSelect, { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ date: 3 }),
    );
  });

  it('renders optional Reference field', () => {
    render(
      <ColumnMappingStep
        headers={sampleHeaders}
        sampleRows={sampleRows}
        mapping={defaultMapping}
        onMappingChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/reference/i)).toBeInTheDocument();
  });

  it('shows header names in dropdown options', () => {
    render(
      <ColumnMappingStep
        headers={sampleHeaders}
        sampleRows={sampleRows}
        mapping={defaultMapping}
        onMappingChange={() => {}}
      />,
    );
    // Each dropdown should list the column headers as options
    const dateSelect = screen.getByLabelText(/date/i);
    expect(dateSelect).toBeInTheDocument();
    // Check that the header names appear as option text
    const options = dateSelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map((o) => o.textContent);
    expect(optionTexts).toContain('Transaction Date');
    expect(optionTexts).toContain('Memo');
    expect(optionTexts).toContain('Amount');
  });
});
