interface MobileOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function MobileOverlay({ open, onClose }: MobileOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={onClose}
      aria-hidden="true"
      data-testid="mobile-overlay"
    />
  );
}
