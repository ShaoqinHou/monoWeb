import { useState, useCallback, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Input } from '../../../components/ui/Input';
import { BankRuleList } from '../components/BankRuleList';
import { BankRuleForm } from '../components/BankRuleForm';
import { useBankRules, useCreateBankRule } from '../hooks/useBankRules';
import { useBankAccounts, useAccounts } from '../hooks/useAccounts';
import { showToast } from '../../dashboard/components/ToastContainer';
import type { CreateBankRule, RuleDirection } from '../hooks/useBankRules';

const RULE_TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'spend', label: 'Spend Money' },
  { value: 'receive', label: 'Receive Money' },
  { value: 'transfer', label: 'Transfer Money' },
] as const;

type RuleTypeTabValue = 'all' | RuleDirection;

export function BankRulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ruleTypeFilter, setRuleTypeFilter] = useState<RuleTypeTabValue>('all');
  const { data: rules = [], isLoading } = useBankRules();
  const createRule = useCreateBankRule();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: allAccounts = [] } = useAccounts();

  const bankAccountOptions = useMemo(
    () =>
      bankAccounts.map((a) => ({
        value: a.id,
        label: `${a.accountNumber} - ${a.name}`,
      })),
    [bankAccounts],
  );

  const accountCodeOptions = useMemo(
    () =>
      allAccounts.map((a) => ({
        value: a.code,
        label: `${a.code} - ${a.name}`,
      })),
    [allAccounts],
  );

  const handleCreate = useCallback(
    (data: CreateBankRule) => {
      createRule.mutate(data, {
        onSuccess: () => setShowForm(false),
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to create bank rule');
        },
      });
    },
    [createRule],
  );

  const filteredRules = useMemo(() => {
    let result = rules;
    if (ruleTypeFilter !== 'all') {
      result = result.filter((r) => r.direction === ruleTypeFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(lower));
    }
    return result;
  }, [rules, ruleTypeFilter, searchTerm]);

  return (
    <PageContainer
      title="Bank Rules"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Bank Rules' },
      ]}
    >
      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">New Bank Rule</h2>
          <BankRuleForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={createRule.isPending}
            bankAccountOptions={bankAccountOptions}
            accountCodeOptions={accountCodeOptions}
          />
        </div>
      )}

      {/* Direction tabs */}
      <div className="mb-4 border-b border-[#e5e7eb]" data-testid="bankrule-type-tabs">
        <div className="flex gap-0">
          {RULE_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
                ruleTypeFilter === tab.value
                  ? 'border-b-2 border-[#0078c8] text-[#0078c8]'
                  : 'border-b-2 border-transparent text-[#6b7280] hover:text-[#1a1a2e]'
              }`}
              onClick={() => setRuleTypeFilter(tab.value)}
              data-testid={`bankrule-tab-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center">
        <Input
          type="search"
          placeholder="Search rules"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
          data-testid="bankrule-search"
        />
      </div>

      <BankRuleList
        rules={filteredRules}
        isLoading={isLoading}
        onNewRule={!showForm ? () => setShowForm(true) : undefined}
      />
    </PageContainer>
  );
}
