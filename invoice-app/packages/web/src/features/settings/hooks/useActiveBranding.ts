import { useBranding } from './useBranding';
import type { BrandingTheme } from './useBranding';

export interface ActiveBrandingTheme {
  logo: string;
  accentColor: string;
  font: string;
  themeName: string;
}

const FALLBACK_THEME: ActiveBrandingTheme = {
  logo: '',
  accentColor: '#0078c8',
  font: 'Arial',
  themeName: 'Standard',
};

/**
 * Returns the active branding theme for use in invoice previews and PDFs.
 * Consumed by InvoicePDFPreview and BrandingPreview.
 */
export function useActiveBranding(): { data: ActiveBrandingTheme | undefined; isLoading: boolean } {
  const { data: branding, isLoading } = useBranding();

  if (!branding) {
    return { data: isLoading ? undefined : FALLBACK_THEME, isLoading };
  }

  const activeTheme: BrandingTheme | undefined = branding.themes.find(
    (t) => t.id === branding.activeThemeId,
  ) ?? branding.themes[0];

  if (!activeTheme) {
    return { data: FALLBACK_THEME, isLoading: false };
  }

  return {
    data: {
      logo: activeTheme.logo,
      accentColor: activeTheme.accentColor,
      font: activeTheme.font,
      themeName: activeTheme.name,
    },
    isLoading: false,
  };
}
