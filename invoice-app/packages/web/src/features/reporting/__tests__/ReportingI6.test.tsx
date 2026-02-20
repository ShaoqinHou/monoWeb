// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { PrintReportButton } from '../components/PrintReportButton';
import { PrintStylesheet } from '../components/PrintStylesheet';
import { usePrintReport, PRINT_CLASS } from '../hooks/usePrintReport';

describe('PrintReportButton', () => {
  it('renders a print button', () => {
    render(<PrintReportButton onPrint={() => {}} />);
    const btn = screen.getByTestId('print-report-button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Print');
  });

  it('calls onPrint when clicked', async () => {
    const user = userEvent.setup();
    const onPrint = vi.fn();
    render(<PrintReportButton onPrint={onPrint} />);
    await user.click(screen.getByTestId('print-report-button'));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it('shows "Preparing..." when preparing is true', () => {
    render(<PrintReportButton onPrint={() => {}} preparing={true} />);
    const btn = screen.getByTestId('print-report-button');
    expect(btn).toHaveTextContent('Preparing...');
    expect(btn).toBeDisabled();
  });
});

describe('PrintStylesheet', () => {
  it('renders a style tag with @media print rules', () => {
    render(<PrintStylesheet />);
    const style = screen.getByTestId('print-stylesheet');
    expect(style).toBeInTheDocument();
    expect(style.tagName).toBe('STYLE');
    expect(style.textContent).toContain('@media print');
  });

  it('hides nav, header, footer in print', () => {
    render(<PrintStylesheet />);
    const style = screen.getByTestId('print-stylesheet');
    expect(style.textContent).toContain('display: none !important');
    expect(style.textContent).toContain('nav');
    expect(style.textContent).toContain('header');
    expect(style.textContent).toContain('footer');
  });

  it('includes print-mode full-width rule', () => {
    render(<PrintStylesheet />);
    const style = screen.getByTestId('print-stylesheet');
    expect(style.textContent).toContain('.xero-print-mode');
    expect(style.textContent).toContain('width: 100%');
  });
});

describe('usePrintReport', () => {
  let printSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  it('returns a ref and handlePrint function', () => {
    const { result } = renderHook(() => usePrintReport());
    expect(result.current.printRef).toBeDefined();
    expect(typeof result.current.handlePrint).toBe('function');
    expect(result.current.preparing).toBe(false);
  });

  it('handlePrint adds print class, calls window.print, then removes class', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const { result } = renderHook(() => usePrintReport());

    // Attach ref manually
    Object.defineProperty(result.current.printRef, 'current', {
      value: div,
      writable: true,
    });

    // Mock requestAnimationFrame to fire synchronously
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    act(() => {
      result.current.handlePrint();
    });

    expect(printSpy).toHaveBeenCalledTimes(1);
    // After print, class should be removed
    expect(div.classList.contains(PRINT_CLASS)).toBe(false);

    rafSpy.mockRestore();
    document.body.removeChild(div);
  });
});
