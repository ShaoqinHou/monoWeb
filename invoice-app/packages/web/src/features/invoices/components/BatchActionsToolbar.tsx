import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';

export interface BatchAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  requiresConfirmation?: boolean;
  confirmMessage?: string;
}

export interface BatchActionsToolbarProps {
  selectedCount: number;
  actions: BatchAction[];
  onAction: (actionId: string) => void;
  onClearSelection?: () => void;
}

/** Toolbar shown when items are selected on a list page */
export function BatchActionsToolbar({
  selectedCount,
  actions,
  onAction,
  onClearSelection,
}: BatchActionsToolbarProps) {
  const [confirmAction, setConfirmAction] = useState<BatchAction | null>(null);

  if (selectedCount === 0) return null;

  const handleActionClick = (action: BatchAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
    } else {
      onAction(action.id);
    }
  };

  const handleConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction.id);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-lg border border-[#0078c8]/20 bg-[#0078c8]/5 px-4 py-2"
        role="toolbar"
        aria-label="Batch actions"
        data-testid="batch-actions-toolbar"
      >
        <span className="text-sm font-medium text-[#1a1a2e]">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <div className="h-4 w-px bg-[#e5e7eb]" />

        {actions.map(action => (
          <Button
            key={action.id}
            variant={action.variant ?? 'secondary'}
            size="sm"
            onClick={() => handleActionClick(action)}
            data-testid={`batch-action-${action.id}`}
          >
            {action.label}
          </Button>
        ))}

        {onClearSelection && (
          <>
            <div className="h-4 w-px bg-[#e5e7eb]" />
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear selection
            </Button>
          </>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.variant === 'destructive' ? 'destructive' : 'primary'}
              onClick={handleConfirm}
              data-testid="confirm-batch-action"
            >
              {confirmAction?.label}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#1a1a2e]">
          {confirmAction?.confirmMessage ??
            `Are you sure you want to ${confirmAction?.label.toLowerCase()} ${selectedCount} item${selectedCount !== 1 ? 's' : ''}?`}
        </p>
      </Dialog>
    </>
  );
}
