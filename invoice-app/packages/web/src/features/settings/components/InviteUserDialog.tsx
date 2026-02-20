import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
}

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Standard', label: 'Standard' },
  { value: 'ReadOnly', label: 'Read Only' },
  { value: 'Advisor', label: 'Advisor' },
];

export function InviteUserDialog({ open, onClose, onInvite }: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Standard');

  const handleInvite = () => {
    if (email.trim()) {
      onInvite(email.trim(), role);
      setEmail('');
      setRole('Standard');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite User"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email.trim()}
            data-testid="send-invite"
          >
            Send Invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          inputId="invite-email"
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          selectId="invite-role"
        />
      </div>
    </Dialog>
  );
}
