import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PdfPreview } from "../PdfPreview";
import type { PdfDocument } from "../../../lib/pdf/generatePdf";

const mockDoc: PdfDocument = {
  title: "Invoice INV-0042",
  html: "<p>Invoice Content</p>",
  styles: "body { font-family: sans-serif; }",
};

describe("PdfPreview", () => {
  it("renders dialog when open=true", () => {
    render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={mockDoc}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when open=false", () => {
    const { container } = render(
      <PdfPreview
        open={false}
        onClose={vi.fn()}
        document={mockDoc}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows document title in the dialog header", () => {
    render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={mockDoc}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(screen.getByText("Invoice INV-0042")).toBeInTheDocument();
  });

  it("renders an iframe for preview content", () => {
    const { container } = render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={mockDoc}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
  });

  it("calls onPrint when print button is clicked", () => {
    const onPrint = vi.fn();
    render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={mockDoc}
        onPrint={onPrint}
        onDownload={vi.fn()}
      />,
    );
    const printBtn = screen.getByRole("button", { name: /print/i });
    fireEvent.click(printBtn);
    expect(onPrint).toHaveBeenCalledOnce();
  });

  it("calls onDownload when download button is clicked", () => {
    const onDownload = vi.fn();
    render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={mockDoc}
        onPrint={vi.fn()}
        onDownload={onDownload}
      />,
    );
    const downloadBtn = screen.getByRole("button", { name: /download/i });
    fireEvent.click(downloadBtn);
    expect(onDownload).toHaveBeenCalledOnce();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <PdfPreview
        open={true}
        onClose={onClose}
        document={mockDoc}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows loading state when document is null", () => {
    render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={null}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    // Print and Download buttons should be disabled in loading state
    const printBtn = screen.getByRole("button", { name: /print/i });
    const downloadBtn = screen.getByRole("button", { name: /download/i });
    expect(printBtn).toBeDisabled();
    expect(downloadBtn).toBeDisabled();
  });

  it("does not render iframe when document is null (loading)", () => {
    const { container } = render(
      <PdfPreview
        open={true}
        onClose={vi.fn()}
        document={null}
        onPrint={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    expect(container.querySelector("iframe")).toBeNull();
  });
});
