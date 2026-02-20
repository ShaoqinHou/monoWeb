// @stub - Hardcoded 5 apps with toggles. No real OAuth integrations.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { showToast } from '../../dashboard/components/ToastContainer';

interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
}

const connectedAppsKeys = {
  all: ['connected-apps'] as const,
  list: () => [...connectedAppsKeys.all, 'list'] as const,
};

function useConnectedApps() {
  return useQuery({
    queryKey: connectedAppsKeys.list(),
    queryFn: () => apiFetch<ConnectedApp[]>('/connected-apps'),
    staleTime: 5 * 60 * 1000,
  });
}

function useToggleConnectedApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, connected }: { id: string; connected: boolean }) =>
      apiPut<ConnectedApp>(`/connected-apps/${id}`, { connected }),
    onMutate: async ({ id, connected }) => {
      // Optimistic update for instant UI feedback
      await queryClient.cancelQueries({ queryKey: connectedAppsKeys.list() });
      const previous = queryClient.getQueryData<ConnectedApp[]>(connectedAppsKeys.list());
      queryClient.setQueryData<ConnectedApp[]>(connectedAppsKeys.list(), (old) =>
        old?.map((a) => (a.id === id ? { ...a, connected } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(connectedAppsKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: connectedAppsKeys.list() });
    },
  });
}

export function ConnectedAppsPage() {
  const { data: apps, isLoading } = useConnectedApps();
  const toggleApp = useToggleConnectedApp();

  if (isLoading || !apps) {
    return (
      <PageContainer
        title="Connected Apps"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Connected Apps' },
        ]}
      >
        <p className="text-sm text-[#6b7280]">Loading connected apps...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Connected Apps"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Connected Apps' },
      ]}
    >
      <p className="text-sm text-[#6b7280] mb-4">
        Manage third-party integrations connected to your organisation.
      </p>

      <div className="space-y-3" data-testid="connected-apps-list">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardContent>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0078c8]/10 text-[#0078c8] text-sm font-bold">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1a1a2e]">
                        {app.name}
                      </h3>
                      {app.connected && (
                        <Badge variant="success" data-testid={`badge-${app.id}`}>
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6b7280] mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant={app.connected ? 'destructive' : 'primary'}
                  size="sm"
                  onClick={() => toggleApp.mutate({ id: app.id, connected: !app.connected }, {
                    onSuccess: () => showToast('success', `${app.name} ${!app.connected ? 'connected' : 'disconnected'}`),
                    onError: (err: Error) => showToast('error', err.message || 'Failed to update app'),
                  })}
                  data-testid={`toggle-app-${app.id}`}
                >
                  {app.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
