interface BrandingPreviewProps {
  logo: string;
  accentColor: string;
  font: string;
}

export function BrandingPreview({ logo, accentColor, font }: BrandingPreviewProps) {
  return (
    <div
      className="border border-[#e5e7eb] rounded-lg p-6 bg-white max-w-md"
      style={{ fontFamily: font }}
      data-testid="branding-preview"
    >
      {/* Logo area */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: accentColor }}>
        {logo ? (
          <img
            src={logo}
            alt="Company logo"
            className="h-10 max-w-[160px] object-contain"
          />
        ) : (
          <div className="h-10 w-32 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
            No Logo
          </div>
        )}
        <span className="text-lg font-bold" style={{ color: accentColor }}>
          INVOICE
        </span>
      </div>

      {/* Mock invoice content */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Invoice No.</span>
          <span className="font-medium">INV-1042</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span>16 Feb 2026</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Due Date</span>
          <span>18 Mar 2026</span>
        </div>
      </div>

      {/* Mock line items */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Professional Services</span>
          <span>$2,500.00</span>
        </div>
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t-2 flex justify-between text-sm font-bold" style={{ borderColor: accentColor }}>
        <span>Total Due</span>
        <span style={{ color: accentColor }}>$2,875.00</span>
      </div>
    </div>
  );
}
