import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import type { TimesheetEntry, UpdateTimesheetInput } from '../hooks/useTimesheets';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface TimesheetGridProps {
  entries: TimesheetEntry[];
  weekStart: string;
  onChange: (id: string, updates: UpdateTimesheetInput) => void;
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
};

export function TimesheetGrid({ entries, weekStart, onChange }: TimesheetGridProps) {
  const handleHoursChange = (entryId: string, day: typeof DAYS[number], value: string) => {
    const hours = parseFloat(value) || 0;
    onChange(entryId, { [day]: hours });
  };

  return (
    <div data-testid="timesheet-grid">
      <div className="mb-2 text-sm text-[#6b7280]">
        Week starting: <span className="font-medium text-[#1a1a2e]">{weekStart}</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            {DAY_LABELS.map((label) => (
              <TableHead key={label} className="text-center w-20">{label}</TableHead>
            ))}
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <td colSpan={10} className="px-4 py-8 text-center text-[#6b7280]">
                No timesheet entries for this week
              </td>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id} data-testid={`timesheet-row-${entry.employeeId}`}>
                <TableCell className="font-medium">{entry.employeeName}</TableCell>
                {DAYS.map((day) => (
                  <TableCell key={day} className="text-center p-1">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={entry[day]}
                      onChange={(e) => handleHoursChange(entry.id, day, e.target.value)}
                      disabled={entry.status === 'approved'}
                      className="w-16 rounded border border-[#e5e7eb] px-2 py-1 text-center text-sm disabled:bg-gray-50 disabled:text-[#6b7280]"
                      aria-label={`${entry.employeeName} ${day} hours`}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">{entry.total.toFixed(1)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[entry.status] ?? 'default'}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
