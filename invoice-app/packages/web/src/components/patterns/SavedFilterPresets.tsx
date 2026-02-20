import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Dialog } from "../ui/Dialog";
import { Bookmark, Trash2 } from "lucide-react";
import type { FilterPresetsState } from "../../lib/useFilterPresets";
import type { FilterValues } from "../../lib/useAdvancedFilters";

export interface SavedFilterPresetsProps {
  presetsState: FilterPresetsState;
  currentFilters: FilterValues;
  onLoadPreset: (filters: FilterValues) => void;
}

export function SavedFilterPresets({
  presetsState,
  currentFilters,
  onLoadPreset,
}: SavedFilterPresetsProps) {
  const { presets, savePreset, deletePreset, loadPreset } = presetsState;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");

  const handleSave = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), currentFilters);
    setPresetName("");
    setShowSaveDialog(false);
  };

  const handleLoad = (id: string) => {
    const filters = loadPreset(id);
    if (filters) {
      onLoadPreset(filters);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative" data-testid="saved-filter-presets">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDropdown(!showDropdown)}
          data-testid="presets-dropdown-toggle"
        >
          <Bookmark className="h-3 w-3 mr-1" />
          Saved Filters ({presets.length})
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSaveDialog(true)}
          data-testid="save-preset-button"
        >
          Save Current
        </Button>
      </div>

      {showDropdown && (
        <div
          className="absolute top-full left-0 z-10 mt-1 w-64 rounded-lg border border-[#e5e7eb] bg-white shadow-lg"
          data-testid="presets-dropdown"
        >
          {presets.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#6b7280]">
              No saved presets
            </div>
          ) : (
            <ul className="py-1">
              {presets.map((preset) => (
                <li
                  key={preset.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                >
                  <button
                    className="flex-1 text-left text-sm text-[#1a1a2e]"
                    onClick={() => handleLoad(preset.id)}
                    data-testid={`preset-load-${preset.id}`}
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="ml-2 rounded p-1 text-[#6b7280] hover:bg-gray-100 hover:text-[#ef4444]"
                    aria-label={`Delete ${preset.name}`}
                    data-testid={`preset-delete-${preset.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Save Filter Preset"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!presetName.trim()}
              data-testid="save-preset-confirm"
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Preset Name"
          placeholder="e.g. Overdue invoices"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          data-testid="preset-name-input"
        />
      </Dialog>
    </div>
  );
}
