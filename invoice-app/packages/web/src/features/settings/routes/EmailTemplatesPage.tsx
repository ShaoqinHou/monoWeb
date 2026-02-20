import { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent, CardFooter } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { EmailTemplateEditor } from '../components/EmailTemplateEditor';
import { showToast } from '../../dashboard/components/ToastContainer';
import {
  useEmailTemplates,
  useSaveEmailTemplate,
  EMAIL_TEMPLATE_VARIABLES,
} from '../hooks/useEmailTemplates';
import type { EmailTemplate } from '../hooks/useEmailTemplates';

const TYPE_OPTIONS = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'quote', label: 'Quote' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'purchase-order', label: 'Purchase Order' },
];

export function EmailTemplatesPage() {
  const { data: templates, isLoading } = useEmailTemplates();
  const saveMutation = useSaveEmailTemplate();
  const [selectedType, setSelectedType] = useState<EmailTemplate['type']>('invoice');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [initialized, setInitialized] = useState(false);

  const currentTemplate = templates?.find((t) => t.type === selectedType);

  // Sync local state when template data loads or type changes
  if (currentTemplate && (!initialized || !editSubject)) {
    if (!initialized) {
      setEditSubject(currentTemplate.subject);
      setEditBody(currentTemplate.body);
      setInitialized(true);
    }
  }

  const handleTypeChange = (type: string) => {
    const newType = type as EmailTemplate['type'];
    setSelectedType(newType);
    const tmpl = templates?.find((t) => t.type === newType);
    if (tmpl) {
      setEditSubject(tmpl.subject);
      setEditBody(tmpl.body);
    }
  };

  const handleFieldChange = (field: 'subject' | 'body', value: string) => {
    if (field === 'subject') setEditSubject(value);
    else setEditBody(value);
  };

  const handleSave = () => {
    saveMutation.mutate({
      type: selectedType,
      subject: editSubject,
      body: editBody,
    }, {
      onSuccess: () => showToast('success', 'Email template saved'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to save template'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Email Templates">
        <p className="text-gray-500">Loading templates...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Email Templates"
      breadcrumbs={[
        { label: 'Settings', href: '/settings' },
        { label: 'Email Templates' },
      ]}
    >
      <Card>
        <CardContent>
          <div className="space-y-6">
            <Select
              label="Template Type"
              options={TYPE_OPTIONS}
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              selectId="template-type"
            />

            <EmailTemplateEditor
              subject={editSubject}
              body={editBody}
              onChange={handleFieldChange}
              variables={EMAIL_TEMPLATE_VARIABLES}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSave}
            loading={saveMutation.isPending}
            data-testid="save-template"
          >
            Save Template
          </Button>
        </CardFooter>
      </Card>
    </PageContainer>
  );
}
