import { useState, useMemo } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Dialog } from '../../../../components/ui/Dialog';
import {
  useCreateRuleFromTransaction,
  generateRuleConditions,
} from '../hooks/useCreateRuleFromTransaction';
import type { RuleCondition } from '../hooks/useCreateRuleFromTransaction';
import type { BankTransaction } from '../types';

interface CreateRuleFromTransactionProps {
  transaction: BankTransaction;
  open: boolean;
  onClose: () => void;
}

export function CreateRuleFromTransaction({
  transaction,
  open,
  onClose,
}: CreateRuleFromTransactionProps) {
  const defaultConditions = useMemo(
    () => generateRuleConditions(transaction),
    [transaction],
  );

  const [ruleName, setRuleName] = useState(`Rule for ${transaction.description}`);
  const [accountCode, setAccountCode] = useState('');
  const [conditions, setConditions] = useState<RuleCondition[]>(defaultConditions);

  const mutation = useCreateRuleFromTransaction();

  const handleSave = () => {
    mutation.mutate(
      {
        name: ruleName,
        conditions,
        accountCode,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const handleConditionChange = (index: number, field: keyof RuleCondition, value: string) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const matchPreview = conditions.length > 0
    ? `This rule will match transactions where ${conditions
        .map((c) => `${c.field} ${c.operator} "${c.value}"`)
        .join(' AND ')}`
    : 'No conditions defined';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create Bank Rule"
      className="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={mutation.isPending}
            disabled={!ruleName || !accountCode}
          >
            Save Rule
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Rule Name"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          data-testid="rule-name-input"
        />

        <Input
          label="Account Code"
          value={accountCode}
          onChange={(e) => setAccountCode(e.target.value)}
          placeholder="e.g. 400"
          data-testid="account-code-input"
        />

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions</h4>
          {conditions.map((condition, i) => (
            <div key={i} className="flex items-center gap-2 mb-2" data-testid={`condition-${i}`}>
              <span className="text-sm text-gray-600 w-24">{condition.field}</span>
              <span className="text-sm text-gray-500">{condition.operator}</span>
              <Input
                value={condition.value}
                onChange={(e) => handleConditionChange(i, 'value', e.target.value)}
                className="flex-1"
              />
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3" data-testid="rule-preview">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Match Preview</h4>
          <p className="text-sm text-blue-700">{matchPreview}</p>
        </div>
      </div>
    </Dialog>
  );
}
