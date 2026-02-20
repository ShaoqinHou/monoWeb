import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import type { ContactGroup } from '../hooks/useContactGroups';

interface ContactGroupListProps {
  groups: ContactGroup[];
  isLoading: boolean;
  onGroupClick: (group: ContactGroup) => void;
  onNewGroup: () => void;
  /** Map of groupId -> member count */
  memberCounts?: Record<string, number>;
}

export function ContactGroupList({
  groups,
  isLoading,
  onGroupClick,
  onNewGroup,
  memberCounts,
}: ContactGroupListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#6b7280]" data-testid="groups-loading">
        Loading groups...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Contact Groups</h2>
        <Button variant="primary" size="sm" onClick={onNewGroup} data-testid="new-group-btn">
          New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="py-12 text-center text-[#6b7280]" data-testid="groups-empty">
          No groups found.
        </div>
      ) : (
        <Table data-testid="groups-table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow
                key={group.id}
                data-testid={`group-row-${group.id}`}
                className="cursor-pointer"
                onClick={() => onGroupClick(group)}
              >
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell className="text-[#6b7280]">{group.description ?? '-'}</TableCell>
                <TableCell className="text-right">
                  {memberCounts?.[group.id] ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
