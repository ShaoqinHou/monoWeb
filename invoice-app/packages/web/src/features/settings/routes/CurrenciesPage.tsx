import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { CurrencyRateForm } from '../components/CurrencyRateForm';
import { showToast } from '../../dashboard/components/ToastContainer';
import {
  useCurrencies,
  useUpdateCurrencyRate,
  useToggleCurrency,
} from '../hooks/useCurrencies';

export function CurrenciesPage() {
  const { data: currencies, isLoading } = useCurrencies();
  const updateRate = useUpdateCurrencyRate();
  const toggleCurrency = useToggleCurrency();

  const handleRateChange = (code: string, rate: number) => {
    updateRate.mutate({ code, rate }, {
      onSuccess: () => showToast('success', 'Exchange rate updated'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to update rate'),
    });
  };

  const handleToggle = (code: string, enabled: boolean) => {
    toggleCurrency.mutate({ code, enabled }, {
      onSuccess: () => showToast('success', `Currency ${enabled ? 'enabled' : 'disabled'}`),
      onError: (err: Error) => showToast('error', err.message || 'Failed to toggle currency'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Currencies">
        <p className="text-gray-500">Loading currencies...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Currencies"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Currencies' },
      ]}
    >
      <p className="text-sm text-[#6b7280] mb-4">
        Base currency: <strong>NZD</strong>. Exchange rates are relative to 1 NZD.
      </p>

      <Card>
        <CardHeader>
          <div className="flex items-center text-xs font-medium text-[#6b7280] uppercase tracking-wider">
            <span className="w-16">Code</span>
            <span className="flex-1">Currency</span>
            <span className="w-28 text-right">Rate</span>
            <span className="w-20 text-center">Enabled</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {currencies?.map((currency) => (
              <div
                key={currency.code}
                className="flex items-center gap-4 py-3"
              >
                <div className="flex-1">
                  <CurrencyRateForm
                    currency={currency}
                    onChange={handleRateChange}
                  />
                </div>
                <div className="w-20 flex justify-center">
                  <button
                    role="switch"
                    aria-checked={currency.enabled}
                    aria-label={`Enable ${currency.code}`}
                    onClick={() => handleToggle(currency.code, !currency.enabled)}
                    disabled={currency.code === 'NZD'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      currency.enabled ? 'bg-[#0078c8]' : 'bg-gray-300'
                    } ${currency.code === 'NZD' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    data-testid={`toggle-currency-${currency.code}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        currency.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
