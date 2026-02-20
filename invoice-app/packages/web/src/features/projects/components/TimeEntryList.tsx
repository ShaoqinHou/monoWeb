import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { TimeEntry } from '../types';

interface TimeEntryListProps {
  entries: TimeEntry[];
  showProject?: boolean;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function TimeEntryList({
  entries,
  showProject = true,
  onEdit,
  onDelete,
}: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-time-entries">
        <p className="text-[#6b7280] text-sm">No time entries found</p>
      </div>
    );
  }

  const totalHours = entries.reduce((sum, e) => sum + e.duration / 60, 0);
  const billableHours = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.duration / 60, 0);
  const totalCost = entries.reduce(
    (sum, e) => sum + (e.duration / 60) * e.hourlyRate,
    0,
  );

  return (
    <div>
      {/* Summary bar */}
      <div
        className="flex gap-6 mb-4 p-3 bg-gray-50 rounded-lg text-sm"
        data-testid="time-entry-summary"
      >
        <div>
          <span className="text-[#6b7280]">Total Hours: </span>
          <span className="font-medium text-[#1a1a2e]" data-testid="summary-total-hours">
            {totalHours.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-[#6b7280]">Billable Hours: </span>
          <span className="font-medium text-[#1a1a2e]" data-testid="summary-billable-hours">
            {billableHours.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-[#6b7280]">Total Cost: </span>
          <span className="font-medium text-[#1a1a2e]" data-testid="summary-total-cost">
            {formatCurrency(totalCost)}
          </span>
        </div>
      </div>

      <Table data-testid="time-entry-table">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showProject && <TableHead>Project</TableHead>}
            <TableHead>Task</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            {(onEdit || onDelete) && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const amount = (entry.duration / 60) * entry.hourlyRate;
            return (
              <TableRow key={entry.id} data-testid={`time-entry-${entry.id}`}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString('en-NZ', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                {showProject && <TableCell>{entry.projectName}</TableCell>}
                <TableCell>
                  <div>
                    <div className="font-medium">{entry.taskName}</div>
                    {entry.description && (
                      <div className="text-xs text-[#6b7280] mt-0.5">
                        {entry.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{entry.staffName}</TableCell>
                <TableCell>{formatDuration(entry.duration)}</TableCell>
                <TableCell>{formatCurrency(amount)}</TableCell>
                <TableCell>
                  <Badge variant={entry.billable ? 'success' : 'default'}>
                    {entry.billable ? 'Billable' : 'Non-billable'}
                  </Badge>
                </TableCell>
                {(onEdit || onDelete) && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(entry)}
                          aria-label={`Edit ${entry.taskName}`}
                        >
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(entry.id)}
                          aria-label={`Delete ${entry.taskName}`}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { formatDuration };
