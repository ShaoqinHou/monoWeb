// @stub - Fake payment gateway toggles. No real Stripe/PayPal OAuth.
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import { showToast } from '../../dashboard/components/ToastContainer';
import { settingsKeys } from '../hooks/keys';

interface PaymentService {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_SERVICES: PaymentService[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept credit card payments online. Supports Visa, Mastercard, Amex.',
    enabled: false,
  },
  {
    id: 'gocardless',
    name: 'GoCardless',
    description: 'Collect recurring payments via direct debit. Low fees, automated collection.',
    enabled: false,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Accept payments via PayPal balance, cards, and bank transfers worldwide.',
    enabled: true,
  },
];

const SETTING_KEY = 'payment-services';

function usePaymentServices() {
  return useQuery({
    queryKey: [...settingsKeys.all, 'payment-services'] as const,
    queryFn: async (): Promise<PaymentService[]> => {
      try {
        const entry = await apiFetch<{ key: string; value: string }>(`/settings/${SETTING_KEY}`);
        return JSON.parse(entry.value) as PaymentService[];
      } catch {
        return [...DEFAULT_SERVICES];
      }
    },
    staleTime: 60 * 1000,
  });
}

function useSavePaymentServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (services: PaymentService[]): Promise<PaymentService[]> => {
      await apiPut(`/settings/${SETTING_KEY}`, { value: JSON.stringify(services) });
      return services;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...settingsKeys.all, 'payment-services'], data);
    },
  });
}

export function PaymentServicesPage() {
  const { data: savedServices, isLoading } = usePaymentServices();
  const saveMutation = useSavePaymentServices();
  const [services, setServices] = useState<PaymentService[]>(DEFAULT_SERVICES);

  useEffect(() => {
    if (savedServices) {
      setServices(savedServices);
    }
  }, [savedServices]);

  const toggleService = (id: string) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s,
    );
    setServices(updated);
    saveMutation.mutate(updated, {
      onSuccess: () => showToast('success', 'Payment service updated'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to update service'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Payment Services">
        <p className="text-gray-500">Loading payment services...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Payment Services"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Payment Services' },
      ]}
    >
      <div className="space-y-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#1a1a2e]">
                    {service.name}
                  </h3>
                  <p className="text-sm text-[#6b7280] mt-1">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <button
                    role="switch"
                    aria-checked={service.enabled}
                    aria-label={`Toggle ${service.name}`}
                    onClick={() => toggleService(service.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      service.enabled ? 'bg-[#0078c8]' : 'bg-gray-300'
                    }`}
                    data-testid={`toggle-${service.id}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        service.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <NotImplemented label="Configure not yet implemented">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!service.enabled}
                      data-testid={`configure-${service.id}`}
                    >
                      Configure
                    </Button>
                  </NotImplemented>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
