import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Table, TableBody } from '../../../components/ui/Table';
import { AccountRow } from './AccountRow';
import type { AccountGroup } from '../types';

interface AccountTypeSectionProps {
  group: AccountGroup;
  defaultExpanded?: boolean;
}

export function AccountTypeSection({ group, defaultExpanded = true }: AccountTypeSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${group.label} section`}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        {group.label}
      </button>
      {expanded && (
        <Table>
          <TableBody>
            {group.accounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
