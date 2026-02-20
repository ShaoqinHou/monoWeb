// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportTable } from '../components/ReportTable';
import type { ReportSection } from '../types';

const mockSections: ReportSection[] = [
  {
    rows: [
      { label: 'Revenue', type: 'header' },
      { label: 'Sales', amount: 10000, type: 'item' },
      { label: 'Services', amount: 5000, type: 'item' },
      { label: 'Total Revenue', amount: 15000, type: 'total' },
    ],
  },
  {
    rows: [
      { label: 'Net Profit', amount: 15000, type: 'grand-total' },
    ],
  },
];

describe('ReportTable', () => {
  it('renders all rows', () => {
    render(<ReportTable sections={mockSections} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
  });

  it('formats amounts as currency', () => {
    render(<ReportTable sections={mockSections} />);

    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('does not show amount for header rows without amount', () => {
    render(<ReportTable sections={mockSections} />);

    // The Revenue header should exist
    const revenueRow = screen.getByText('Revenue').closest('tr');
    expect(revenueRow).not.toBeNull();

    // Second cell should be empty for header without amount
    const cells = revenueRow!.querySelectorAll('td');
    expect(cells[1].textContent).toBe('');
  });

  it('applies header row styling', () => {
    render(<ReportTable sections={mockSections} />);

    const revenueRow = screen.getByText('Revenue').closest('tr');
    expect(revenueRow).toHaveAttribute('data-row-type', 'header');
  });

  it('applies total row styling', () => {
    render(<ReportTable sections={mockSections} />);

    const totalRow = screen.getByText('Total Revenue').closest('tr');
    expect(totalRow).toHaveAttribute('data-row-type', 'total');
  });

  it('applies grand-total row styling', () => {
    render(<ReportTable sections={mockSections} />);

    const grandTotalRow = screen.getByText('Net Profit').closest('tr');
    expect(grandTotalRow).toHaveAttribute('data-row-type', 'grand-total');
  });

  it('applies item row styling', () => {
    render(<ReportTable sections={mockSections} />);

    const itemRow = screen.getByText('Sales').closest('tr');
    expect(itemRow).toHaveAttribute('data-row-type', 'item');
  });

  it('renders header and total labels as bold', () => {
    render(<ReportTable sections={mockSections} />);

    const headerLabel = screen.getByText('Revenue').closest('td');
    expect(headerLabel?.className).toContain('font-bold');

    const totalLabel = screen.getByText('Total Revenue').closest('td');
    expect(totalLabel?.className).toContain('font-bold');

    const grandTotalLabel = screen.getByText('Net Profit').closest('td');
    expect(grandTotalLabel?.className).toContain('font-bold');
  });

  it('renders item labels as normal weight', () => {
    render(<ReportTable sections={mockSections} />);

    const itemLabel = screen.getByText('Sales').closest('td');
    expect(itemLabel?.className).not.toContain('font-bold');
  });

  it('supports nested indentation', () => {
    const nestedSections: ReportSection[] = [
      {
        rows: [
          { label: 'Assets', type: 'header' },
          { label: 'Current Assets', type: 'header', indent: 1 },
          { label: 'Cash', amount: 1000, type: 'item', indent: 2 },
        ],
      },
    ];

    render(<ReportTable sections={nestedSections} />);

    const cashCell = screen.getByText('Cash').closest('td');
    expect(cashCell?.style.paddingLeft).toBe('3rem'); // indent 2 * 1.5rem
  });

  it('renders empty table when no sections', () => {
    const { container } = render(<ReportTable sections={[]} />);
    const tbody = container.querySelector('tbody');
    expect(tbody).toBeInTheDocument();
    expect(tbody!.children.length).toBe(0);
  });
});
