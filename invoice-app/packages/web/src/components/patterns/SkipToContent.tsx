export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#0078c8] focus:text-white focus:rounded focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-white"
      data-testid="skip-to-content"
    >
      Skip to main content
    </a>
  );
}
