import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import type { BankRule } from '../hooks/useBankRules';

interface BankRuleListProps {
  rules: BankRule[];
  isLoading: boolean;
  onRuleClick?: (rule: BankRule) => void;
  onNewRule?: () => void;
}

export function BankRuleList({
  rules,
  isLoading,
  onRuleClick,
  onNewRule,
}: BankRuleListProps) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#6b7280]" data-testid="rules-loading">
        Loading bank rules...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onNewRule && (
        <div className="flex items-center justify-end">
          <Button variant="primary" size="sm" onClick={onNewRule} data-testid="new-rule-btn">
            New Rule
          </Button>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="py-12 text-center text-[#6b7280]" data-testid="rules-empty">
          No bank rules found.
        </div>
      ) : (
        <Table data-testid="rules-table">
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Allocate To</TableHead>
              <TableHead className="text-right">Tax Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow
                key={rule.id}
                data-testid={`rule-row-${rule.id}`}
                className={onRuleClick ? 'cursor-pointer' : ''}
                onClick={() => onRuleClick?.(rule)}
              >
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rule.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    data-testid={`rule-status-${rule.id}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        rule.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell className="text-[#6b7280]">
                  {rule.matchField} {rule.matchType} &quot;{rule.matchValue}&quot;
                </TableCell>
                <TableCell className="text-[#6b7280]">{rule.allocateToAccountCode}</TableCell>
                <TableCell className="text-right">{rule.taxRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
