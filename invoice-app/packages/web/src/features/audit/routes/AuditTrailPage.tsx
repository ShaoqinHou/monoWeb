import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { AuditFilters } from '../components/AuditFilters';
import { AuditTimeline } from '../components/AuditTimeline';
import { useAuditEntries } from '../hooks/useAudit';
import type { AuditFilters as AuditFiltersType } from '../types';

export function AuditTrailPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  const filters: AuditFiltersType = {};
  if (entityType) filters.entityType = entityType;
  if (action) filters.action = action;
  if (dateRange.start) filters.startDate = dateRange.start;
  if (dateRange.end) filters.endDate = dateRange.end;

  const hasFilters = Object.keys(filters).length > 0;
  const { data, isLoading } = useAuditEntries(hasFilters ? filters : undefined);

  const handleClear = useCallback(() => {
    setEntityType('');
    setAction('');
    setDateRange({ start: '', end: '' });
  }, []);

  const handleEntityClick = useCallback(
    (entType: string, entId: string) => {
      // Build the navigation path based on entity type
      let to = '#';
      const params: Record<string, string> = {};
      switch (entType) {
        case 'invoice':
          to = '/sales/invoices/$invoiceId';
          params.invoiceId = entId;
          break;
        case 'bill':
          to = '/purchases/bills/$billId';
          params.billId = entId;
          break;
        case 'contact':
          to = '/contacts/$contactId';
          params.contactId = entId;
          break;
        default:
          // For other types, navigate to the static href
          return;
      }
      navigate({ to, params });
    },
    [navigate],
  );

  return (
    <PageContainer
      title="Audit Trail"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Audit Trail' },
      ]}
    >
      {/* Filters */}
      <div className="mb-4">
        <AuditFilters
          entityType={entityType}
          action={action}
          dateRange={dateRange}
          onEntityTypeChange={setEntityType}
          onActionChange={setAction}
          onDateRangeChange={setDateRange}
          onClear={handleClear}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div data-testid="audit-loading" className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading audit entries...</span>
        </div>
      ) : (
        <AuditTimeline
          entries={data?.entries ?? []}
          onEntityClick={handleEntityClick}
        />
      )}

      {/* Pagination info */}
      {data && data.total > 0 && (
        <div className="mt-3 text-xs text-gray-500 text-right">
          Showing {data.entries.length} of {data.total} entries
        </div>
      )}
    </PageContainer>
  );
}
