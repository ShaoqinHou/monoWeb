import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import type { ContactGroupWithMembers } from '../hooks/useContactGroups';

interface ContactGroupDetailProps {
  group: ContactGroupWithMembers;
  onAddMember: (contactId: string) => void;
  onRemoveMember: (contactId: string) => void;
  isAddingMember?: boolean;
}

export function ContactGroupDetail({
  group,
  onAddMember,
  onRemoveMember,
  isAddingMember,
}: ContactGroupDetailProps) {
  const [newContactId, setNewContactId] = useState('');

  const handleAddMember = () => {
    if (newContactId.trim()) {
      onAddMember(newContactId.trim());
      setNewContactId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Group Info */}
      <div>
        <h2 className="text-xl font-bold text-gray-900" data-testid="group-name">
          {group.name}
        </h2>
        {group.description && (
          <p className="mt-1 text-[#6b7280]" data-testid="group-description">
            {group.description}
          </p>
        )}
      </div>

      {/* Add Member */}
      <div className="flex items-end gap-2" data-testid="add-member-section">
        <div className="flex-1 max-w-sm">
          <Input
            label="Add Member (Contact ID)"
            placeholder="Enter contact ID..."
            value={newContactId}
            onChange={(e) => setNewContactId(e.target.value)}
            data-testid="add-member-input"
          />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleAddMember}
          disabled={!newContactId.trim() || isAddingMember}
          data-testid="add-member-btn"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Members List */}
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase text-[#6b7280]">
          Members ({group.members.length})
        </h3>

        {group.members.length === 0 ? (
          <div className="py-8 text-center text-[#6b7280]" data-testid="members-empty">
            No members in this group.
          </div>
        ) : (
          <Table data-testid="members-table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.members.map((member) => (
                <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-[#6b7280] capitalize">{member.type}</TableCell>
                  <TableCell className="text-[#6b7280]">{member.email ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.id)}
                      data-testid={`remove-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-[#ef4444]" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
