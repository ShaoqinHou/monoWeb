import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog } from "../Dialog";

describe("Dialog", () => {
  it("does not render when closed", () => {
    render(
      <Dialog open={false} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(
      <Dialog open={true} onClose={() => {}}>
        <p>Content</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Confirm Delete">
        <p>Are you sure?</p>
      </Dialog>,
    );
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
  });

  it("renders footer", () => {
    render(
      <Dialog
        open={true}
        onClose={() => {}}
        footer={<button>Save</button>}
      >
        <p>Body</p>
      </Dialog>,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Dialog>,
    );
    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key pressed", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <p>Content</p>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <p>Content</p>
      </Dialog>,
    );
    const overlay = screen.getByRole("dialog");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when dialog content is clicked", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose}>
        <p>Content</p>
      </Dialog>,
    );
    fireEvent.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sets aria-modal and aria-label", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="My Dialog">
        <p>Content</p>
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "My Dialog");
  });
});
