import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog } from '../../../components/ui/Dialog';
import { ContactGroupList } from '../components/ContactGroupList';
import { ContactGroupDetail } from '../components/ContactGroupDetail';
import {
  useContactGroups,
  useContactGroup,
  useCreateGroup,
  useDeleteGroup,
  useAddMember,
  useRemoveMember,
} from '../hooks/useContactGroups';
import type { ContactGroup } from '../hooks/useContactGroups';

export function ContactGroupsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const { data: groups = [], isLoading } = useContactGroups();
  const { data: selectedGroup } = useContactGroup(selectedGroupId ?? '');
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const handleGroupClick = useCallback((group: ContactGroup) => {
    setSelectedGroupId(group.id);
  }, []);

  const handleCreateGroup = useCallback(() => {
    if (newGroupName.trim()) {
      createGroup.mutate(
        {
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
        },
        {
          onSuccess: () => {
            setShowNewForm(false);
            setNewGroupName('');
            setNewGroupDescription('');
          },
        },
      );
    }
  }, [newGroupName, newGroupDescription, createGroup]);

  const handleAddMember = useCallback(
    (contactId: string) => {
      if (selectedGroupId) {
        addMember.mutate({ groupId: selectedGroupId, contactId });
      }
    },
    [selectedGroupId, addMember],
  );

  const handleRemoveMember = useCallback(
    (contactId: string) => {
      if (selectedGroupId) {
        removeMember.mutate({ groupId: selectedGroupId, contactId });
      }
    },
    [selectedGroupId, removeMember],
  );

  return (
    <PageContainer
      title="Contact Groups"
      breadcrumbs={[
        { label: 'Contacts', href: '/contacts' },
        { label: 'Groups' },
      ]}
    >
      {selectedGroupId && selectedGroup ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedGroupId(null)}
            data-testid="back-to-groups"
          >
            Back to Groups
          </Button>
          <ContactGroupDetail
            group={selectedGroup}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            isAddingMember={addMember.isPending}
          />
        </div>
      ) : (
        <ContactGroupList
          groups={groups}
          isLoading={isLoading}
          onGroupClick={handleGroupClick}
          onNewGroup={() => setShowNewForm(true)}
        />
      )}

      <Dialog
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        title="New Contact Group"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              loading={createGroup.isPending}
              data-testid="create-group-btn"
            >
              Create Group
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. VIP Clients"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            data-testid="group-name-input"
          />
          <Input
            label="Description"
            placeholder="Optional description"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            data-testid="group-description-input"
          />
        </div>
      </Dialog>
    </PageContainer>
  );
}
