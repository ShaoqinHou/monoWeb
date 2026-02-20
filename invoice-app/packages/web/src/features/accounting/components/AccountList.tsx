import { AccountTypeSection } from './AccountTypeSection';
import type { AccountGroup } from '../types';

interface AccountListProps {
  groups: AccountGroup[];
}

export function AccountList({ groups }: AccountListProps) {
  if (groups.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No accounts found.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {groups.map((group) => (
        <AccountTypeSection key={group.type} group={group} />
      ))}
    </div>
  );
}
