import { Card, CardContent } from '../../../components/ui/Card';
import type { UserProfile } from '../types';

interface UserSettingsProps {
  user: UserProfile;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export function UserSettings({ user }: UserSettingsProps) {
  return (
    <Card>
      <CardContent>
        <div className="py-2">
          <InfoRow label="Name" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
          <InfoRow label="Last Login" value={formatDateTime(user.lastLogin)} />
        </div>
        <p className="text-sm text-gray-400 mt-4">
          User profile settings are read-only. Contact your administrator to make changes.
        </p>
      </CardContent>
    </Card>
  );
}
