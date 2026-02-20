import { Select } from '../../../components/ui/Select';

export interface BrandingTheme {
  id: string;
  name: string;
}

const BRANDING_THEMES: BrandingTheme[] = [
  { id: 'theme-default', name: 'Standard' },
  { id: 'theme-modern', name: 'Modern Blue' },
  { id: 'theme-classic', name: 'Classic Serif' },
  { id: 'theme-minimal', name: 'Minimal' },
];

export interface BrandingThemeSelectProps {
  value: string;
  onChange: (themeId: string) => void;
}

export function BrandingThemeSelect({ value, onChange }: BrandingThemeSelectProps) {
  const options = BRANDING_THEMES.map((t) => ({ value: t.id, label: t.name }));

  return (
    <Select
      label="Branding Theme"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="branding-theme-select"
    />
  );
}

export { BRANDING_THEMES };
