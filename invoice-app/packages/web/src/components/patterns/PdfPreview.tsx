import { useRef, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Printer, Download, Loader2 } from "lucide-react";
import type { PdfDocument } from "../../lib/pdf/generatePdf";

export interface PdfPreviewProps {
  open: boolean;
  onClose: () => void;
  document: PdfDocument | null;
  onPrint: () => void;
  onDownload: () => void;
}

export function PdfPreview({
  open,
  onClose,
  document: doc,
  onPrint,
  onDownload,
}: PdfPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!doc || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc =
      iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(doc.html);
    iframeDoc.close();
  }, [doc]);

  const isLoading = doc === null;

  const footer = (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrint}
        disabled={isLoading}
        aria-label="Print"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onDownload}
        disabled={isLoading}
        aria-label="Download"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={doc?.title ?? "PDF Preview"}
      footer={footer}
      className="max-w-4xl h-[80vh] flex flex-col"
    >
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-20 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Generating preview...</span>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title="PDF Preview"
          className="w-full flex-1 border border-gray-200 rounded bg-white"
          style={{ minHeight: "500px" }}
          sandbox="allow-same-origin"
        />
      )}
    </Dialog>
  );
}
