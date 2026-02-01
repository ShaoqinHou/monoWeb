import React, { useMemo } from 'react';
import { TemplateCommand, PdfFile } from '../types';
import { TEMPLATE_COMMANDS } from '../constants';

interface TemplateSuggestionsProps {
  files: PdfFile[];
  onSelect: (prompt: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  merge: 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30',
  delete: 'bg-red-600/20 text-red-300 hover:bg-red-600/30',
  extract: 'bg-green-600/20 text-green-300 hover:bg-green-600/30',
  general: 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30',
};

export default function TemplateSuggestions({ files, onSelect }: TemplateSuggestionsProps) {
  // Replace {file1}, {file2}, etc. with actual file names
  const resolvedCommands = useMemo(() => {
    return TEMPLATE_COMMANDS.map((cmd) => {
      let prompt = cmd.prompt;
      files.forEach((file, index) => {
        prompt = prompt.replace(new RegExp(`\\{file${index + 1}\\}`, 'g'), file.name);
      });
      // If there are still unresolved placeholders, replace with generic
      prompt = prompt.replace(/\{file\d+\}/g, 'the file');
      return { ...cmd, prompt };
    });
  }, [files]);

  return (
    <div className="p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-semibold">
        Quick commands
      </p>
      <div className="flex flex-wrap gap-1.5">
        {resolvedCommands.map((cmd, i) => (
          <button
            key={i}
            onClick={() => onSelect(cmd.prompt)}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${CATEGORY_COLORS[cmd.category] || CATEGORY_COLORS.general}`}
          >
            {cmd.label}
          </button>
        ))}
      </div>
    </div>
  );
}
