// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrintButton } from '../PrintButton';

describe('PrintButton', () => {
  it('renders with default label', () => {
    render(<PrintButton />);
    expect(screen.getByTestId('print-button')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<PrintButton label="Print Invoice" />);
    expect(screen.getByText('Print Invoice')).toBeInTheDocument();
  });

  it('calls window.print on click', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintButton />);
    fireEvent.click(screen.getByTestId('print-button'));
    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });
});
