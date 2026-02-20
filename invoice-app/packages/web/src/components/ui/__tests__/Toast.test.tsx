import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";

// Helper component to trigger toasts from tests
function ToastTrigger({
  variant = "success" as const,
  message = "Test toast",
  duration,
}: {
  variant?: "success" | "error" | "info" | "warning";
  message?: string;
  duration?: number;
}) {
  const { addToast } = useToast();
  return (
    <button
      onClick={() => addToast({ variant, message, duration })}
      data-testid="trigger"
    >
      Trigger
    </button>
  );
}

function ToastDismisser() {
  const { toasts, removeToast } = useToast();
  return (
    <button
      onClick={() => {
        if (toasts.length > 0) removeToast(toasts[0].id);
      }}
      data-testid="dismiss"
    >
      Dismiss
    </button>
  );
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows toast when triggered", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Operation complete" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Operation complete")).toBeInTheDocument();
  });

  it("shows multiple toasts", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="First" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    fireEvent.click(screen.getByTestId("trigger"));
    // Both have same message but separate toast elements
    const toasts = screen.getAllByText("First");
    expect(toasts).toHaveLength(2);
  });

  it("renders success variant", () => {
    render(
      <ToastProvider>
        <ToastTrigger variant="success" message="Saved" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("renders error variant", () => {
    render(
      <ToastProvider>
        <ToastTrigger variant="error" message="Failed" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders info variant", () => {
    render(
      <ToastProvider>
        <ToastTrigger variant="info" message="FYI" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("FYI")).toBeInTheDocument();
  });

  it("renders warning variant", () => {
    render(
      <ToastProvider>
        <ToastTrigger variant="warning" message="Watch out" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Watch out")).toBeInTheDocument();
  });

  it("auto-dismisses after duration", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Disappearing" duration={3000} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Disappearing")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText("Disappearing")).not.toBeInTheDocument();
  });

  it("defaults to 5 second auto-dismiss", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Default timeout" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Default timeout")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByText("Default timeout")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Default timeout")).not.toBeInTheDocument();
  });

  it("manually dismisses toast via close button", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Closeable" duration={0} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Closeable")).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", { name: "Dismiss" });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText("Closeable")).not.toBeInTheDocument();
  });

  it("removes toast via removeToast", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Remove me" duration={0} />
        <ToastDismisser />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByText("Remove me")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("dismiss"));
    expect(screen.queryByText("Remove me")).not.toBeInTheDocument();
  });

  it("positions toasts in top-right", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Positioned" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    const container = screen.getByTestId("toast-container");
    expect(container.className).toContain("top-4");
    expect(container.className).toContain("right-4");
  });

  it("renders alert role on toast items", () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Alert toast" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByTestId("trigger"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
