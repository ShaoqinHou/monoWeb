// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer, showToast } from '../components/ToastContainer';

describe('ToastContainer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.querySelector('[data-testid="toast-container"]')).toBeNull();
  });

  it('renders a success toast when showToast is called', async () => {
    render(<ToastContainer />);

    act(() => {
      showToast('success', 'Invoice created successfully');
    });

    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    expect(screen.getByText('Invoice created successfully')).toBeInTheDocument();
  });

  it('renders an error toast', async () => {
    render(<ToastContainer />);

    act(() => {
      showToast('error', 'API request failed');
    });

    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    expect(screen.getByText('API request failed')).toBeInTheDocument();
  });

  it('renders an info toast', async () => {
    render(<ToastContainer />);

    act(() => {
      showToast('info', 'Data synced');
    });

    expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    expect(screen.getByText('Data synced')).toBeInTheDocument();
  });

  it('stacks multiple toasts', async () => {
    render(<ToastContainer />);

    act(() => {
      showToast('success', 'First toast');
      showToast('error', 'Second toast');
      showToast('info', 'Third toast');
    });

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();

    const container = screen.getByTestId('toast-container');
    expect(container.children).toHaveLength(3);
  });

  it('dismisses a toast when the close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ToastContainer />);

    act(() => {
      showToast('success', 'Dismissable toast');
    });

    expect(screen.getByText('Dismissable toast')).toBeInTheDocument();

    const dismissButton = screen.getByLabelText('Dismiss');
    await user.click(dismissButton);

    expect(screen.queryByText('Dismissable toast')).not.toBeInTheDocument();
  });

  it('auto-dismisses toasts after 5 seconds', () => {
    vi.useFakeTimers();
    try {
      render(<ToastContainer />);

      act(() => {
        showToast('success', 'Auto-dismiss test');
      });

      expect(screen.getByText('Auto-dismiss test')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5100);
      });

      expect(screen.queryByText('Auto-dismiss test')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('toasts have role="alert" for accessibility', async () => {
    render(<ToastContainer />);

    act(() => {
      showToast('success', 'Accessible toast');
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
