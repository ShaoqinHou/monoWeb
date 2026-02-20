import { useState, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { BrandingPreview } from '../components/BrandingPreview';
import { showToast } from '../../dashboard/components/ToastContainer';
import { useBranding, useSaveBranding } from '../hooks/useBranding';
import type { BrandingTheme } from '../hooks/useBranding';

const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
];

export function BrandingPage() {
  const { data: branding, isLoading } = useBranding();
  const saveMutation = useSaveBranding();
  const [selectedThemeId, setSelectedThemeId] = useState('');
  const [editTheme, setEditTheme] = useState<BrandingTheme | null>(null);

  useEffect(() => {
    if (branding && !selectedThemeId) {
      setSelectedThemeId(branding.activeThemeId);
      const theme = branding.themes.find((t) => t.id === branding.activeThemeId);
      if (theme) setEditTheme({ ...theme });
    }
  }, [branding, selectedThemeId]);

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    const theme = branding?.themes.find((t) => t.id === themeId);
    if (theme) setEditTheme({ ...theme });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editTheme) return;

    const reader = new FileReader();
    reader.onload = () => {
      setEditTheme({ ...editTheme, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!branding || !editTheme) return;
    const updated = {
      ...branding,
      activeThemeId: selectedThemeId,
      themes: branding.themes.map((t) =>
        t.id === editTheme.id ? editTheme : t,
      ),
    };
    saveMutation.mutate(updated, {
      onSuccess: () => showToast('success', 'Branding saved'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to save branding'),
    });
  };

  const handleCreateTheme = () => {
    if (!branding) return;
    const newId = `theme-${Date.now()}`;
    const newTheme: BrandingTheme = {
      id: newId,
      name: `Theme ${branding.themes.length + 1}`,
      logo: '',
      accentColor: '#0078c8',
      font: 'Arial',
    };
    const updated = {
      ...branding,
      themes: [...branding.themes, newTheme],
    };
    saveMutation.mutate(updated, {
      onSuccess: () => showToast('success', 'Theme created'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to create theme'),
    });
    setSelectedThemeId(newId);
    setEditTheme({ ...newTheme });
  };

  const handleDeleteTheme = () => {
    if (!branding || !editTheme || branding.themes.length <= 1) return;
    const remaining = branding.themes.filter((t) => t.id !== editTheme.id);
    const updated = {
      ...branding,
      themes: remaining,
      activeThemeId: remaining[0].id,
    };
    saveMutation.mutate(updated, {
      onSuccess: () => showToast('success', 'Theme deleted'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to delete theme'),
    });
    setSelectedThemeId(remaining[0].id);
    setEditTheme({ ...remaining[0] });
  };

  if (isLoading) {
    return (
      <PageContainer title="Invoice Branding">
        <p className="text-gray-500">Loading branding settings...</p>
      </PageContainer>
    );
  }

  const themeOptions = branding?.themes.map((t) => ({
    value: t.id,
    label: t.name,
  })) ?? [];

  return (
    <PageContainer
      title="Invoice Branding"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Branding' },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardContent>
            <div className="space-y-4 py-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label="Theme"
                    options={themeOptions}
                    value={selectedThemeId}
                    onChange={(e) => handleThemeSelect(e.target.value)}
                    selectId="branding-theme"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTheme}
                  data-testid="create-theme"
                >
                  New Theme
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteTheme}
                  disabled={!branding || branding.themes.length <= 1}
                  data-testid="delete-theme"
                >
                  Delete
                </Button>
              </div>

              {editTheme && (
                <>
                  <Input
                    label="Theme Name"
                    value={editTheme.name}
                    onChange={(e) =>
                      setEditTheme({ ...editTheme, name: e.target.value })
                    }
                    inputId="theme-name"
                  />

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="logo-upload"
                      className="text-sm font-medium text-[#1a1a2e]"
                    >
                      Logo
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="text-sm text-[#6b7280]"
                      data-testid="logo-upload"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="accent-color"
                      className="text-sm font-medium text-[#1a1a2e]"
                    >
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="accent-color"
                        type="color"
                        value={editTheme.accentColor}
                        onChange={(e) =>
                          setEditTheme({ ...editTheme, accentColor: e.target.value })
                        }
                        className="h-10 w-14 rounded border border-[#e5e7eb] cursor-pointer"
                      />
                      <span className="text-sm text-[#6b7280]">
                        {editTheme.accentColor}
                      </span>
                    </div>
                  </div>

                  <Select
                    label="Font"
                    options={FONT_OPTIONS}
                    value={editTheme.font}
                    onChange={(e) =>
                      setEditTheme({ ...editTheme, font: e.target.value })
                    }
                    selectId="branding-font"
                  />
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSave}
              loading={saveMutation.isPending}
              data-testid="save-branding"
            >
              Save Branding
            </Button>
          </CardFooter>
        </Card>

        {/* Preview */}
        <div>
          <h3 className="text-sm font-medium text-[#6b7280] mb-3">Preview</h3>
          {editTheme && (
            <BrandingPreview
              logo={editTheme.logo}
              accentColor={editTheme.accentColor}
              font={editTheme.font}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
