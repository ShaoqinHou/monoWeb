import { useState, useEffect, useRef } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

interface EmailTemplateEditorProps {
  subject: string;
  body: string;
  onChange: (field: 'subject' | 'body', value: string) => void;
  variables: string[];
}

export function EmailTemplateEditor({
  subject,
  body,
  onChange,
  variables,
}: EmailTemplateEditorProps) {
  const [localSubject, setLocalSubject] = useState(subject);
  const [localBody, setLocalBody] = useState(body);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalSubject(subject);
    setLocalBody(body);
  }, [subject, body]);

  const handleSubjectChange = (value: string) => {
    setLocalSubject(value);
    onChange('subject', value);
  };

  const handleBodyChange = (value: string) => {
    setLocalBody(value);
    onChange('body', value);
  };

  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody =
        localBody.substring(0, start) + variable + localBody.substring(end);
      setLocalBody(newBody);
      onChange('body', newBody);
      // Restore cursor after variable
      requestAnimationFrame(() => {
        textarea.selectionStart = start + variable.length;
        textarea.selectionEnd = start + variable.length;
        textarea.focus();
      });
    } else {
      const newBody = localBody + variable;
      setLocalBody(newBody);
      onChange('body', newBody);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Subject"
        value={localSubject}
        onChange={(e) => handleSubjectChange(e.target.value)}
        inputId="template-subject"
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="template-body"
          className="text-sm font-medium text-[#1a1a2e]"
        >
          Body
        </label>
        <textarea
          ref={bodyRef}
          id="template-body"
          value={localBody}
          onChange={(e) => handleBodyChange(e.target.value)}
          rows={10}
          className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8]"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-[#6b7280] mb-2">
          Insert Variable:
        </p>
        <div className="flex flex-wrap gap-1">
          {variables.map((v) => (
            <Button
              key={v}
              variant="outline"
              size="sm"
              onClick={() => insertVariable(v)}
              data-testid={`insert-var-${v}`}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
