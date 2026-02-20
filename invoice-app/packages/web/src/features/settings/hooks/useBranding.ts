import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { settingsKeys } from './keys';

export interface BrandingTheme {
  id: string;
  name: string;
  logo: string; // base64 or empty
  accentColor: string;
  font: string;
}

export interface BrandingSettings {
  themes: BrandingTheme[];
  activeThemeId: string;
}

const SETTING_KEY = 'branding';

const DEFAULT_BRANDING: BrandingSettings = {
  themes: [
    {
      id: 'default',
      name: 'Standard',
      logo: '',
      accentColor: '#0078c8',
      font: 'Arial',
    },
  ],
  activeThemeId: 'default',
};

export function useBranding() {
  return useQuery({
    queryKey: [...settingsKeys.all, 'branding'] as const,
    queryFn: async (): Promise<BrandingSettings> => {
      try {
        const entry = await apiFetch<{ key: string; value: string }>(`/settings/${SETTING_KEY}`);
        return JSON.parse(entry.value) as BrandingSettings;
      } catch {
        return { ...DEFAULT_BRANDING, themes: DEFAULT_BRANDING.themes.map((t) => ({ ...t })) };
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useSaveBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (branding: BrandingSettings): Promise<BrandingSettings> => {
      await apiPut(`/settings/${SETTING_KEY}`, { value: JSON.stringify(branding) });
      return branding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...settingsKeys.all, 'branding'], data);
    },
  });
}
