import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { SmartListBuilder } from '../components/SmartListBuilder';
import {
  useSmartLists,
  useSaveSmartList,
  useDeleteSmartList,
  type SmartListFilter,
} from '../hooks/useSmartLists';

export function SmartListsPage() {
  const { data: smartLists = [] } = useSmartLists();
  const { mutate: saveList } = useSaveSmartList();
  const { mutate: deleteList } = useDeleteSmartList();

  const [listName, setListName] = useState('');
  const [filters, setFilters] = useState<SmartListFilter[]>([]);
  const [nameError, setNameError] = useState('');

  function handleSave() {
    if (!listName.trim()) {
      setNameError('List name is required');
      return;
    }
    setNameError('');
    saveList({ name: listName.trim(), filters });
    setListName('');
    setFilters([]);
  }

  return (
    <div className="space-y-6" data-testid="smart-lists-page">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#1a1a2e]">Smart Lists</h1>
      </div>

      {/* Create New Smart List */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Create Smart List</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="List Name"
              placeholder="My Smart List"
              value={listName}
              onChange={(e) => {
                setListName(e.target.value);
                if (nameError) setNameError('');
              }}
              error={nameError}
              inputId="smart-list-name"
              data-testid="smart-list-name"
            />
            <SmartListBuilder filters={filters} onChange={setFilters} />
            <Button
              variant="primary"
              onClick={handleSave}
              data-testid="save-smart-list-btn"
            >
              Save Smart List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Smart Lists */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Saved Lists</h2>
        </CardHeader>
        <CardContent>
          {smartLists.length === 0 ? (
            <p className="text-sm text-[#6b7280]" data-testid="no-smart-lists">
              No smart lists yet. Create one above.
            </p>
          ) : (
            <ul className="divide-y divide-[#e5e7eb]" data-testid="smart-lists-list">
              {smartLists.map((list) => (
                <li
                  key={list.id}
                  className="flex items-center justify-between py-3"
                  data-testid={`smart-list-item-${list.id}`}
                >
                  <div>
                    <p className="text-sm font-medium text-[#1a1a2e]">{list.name}</p>
                    <p className="text-xs text-[#6b7280]">
                      {list.filters.length} filter{list.filters.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteList(list.id)}
                    data-testid={`delete-smart-list-${list.id}`}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
