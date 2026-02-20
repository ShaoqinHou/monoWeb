import { useEffect, useState, useCallback } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface UnsavedChangesGuardProps {
  isDirty: boolean;
  message?: string;
}

export function UnsavedChangesGuard({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UnsavedChangesGuardProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // beforeunload for browser tab close / external navigation
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = message;
      return message;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  const handleConfirm = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return (
    <ConfirmDialog
      open={showDialog}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title="Unsaved Changes"
      message={message}
      confirmLabel="Leave"
      variant="destructive"
    />
  );
}

export type { UnsavedChangesGuardProps };
