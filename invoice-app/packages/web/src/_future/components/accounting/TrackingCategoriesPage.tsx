import { useState, useCallback } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { TrackingCategoryForm } from '../../../features/accounting/components/TrackingCategoryForm';
import {
  useTrackingCategories,
  useCreateTrackingCategory,
  useUpdateTrackingCategory,
  useDeleteTrackingCategory,
} from '../../../features/accounting/hooks/useTrackingCategories';
import type { TrackingCategory } from '../../../features/accounting/hooks/useTrackingCategories';

export function TrackingCategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TrackingCategory | null>(null);

  const { data: categories = [], isLoading } = useTrackingCategories();
  const createCategory = useCreateTrackingCategory();
  const updateCategory = useUpdateTrackingCategory();
  const deleteCategory = useDeleteTrackingCategory();

  const handleCreate = useCallback(
    (data: { name: string; options: string[] }) => {
      createCategory.mutate(data, {
        onSuccess: () => {
          setShowForm(false);
        },
      });
    },
    [createCategory],
  );

  const handleUpdate = useCallback(
    (data: { name: string; options: string[] }) => {
      if (!editingCategory) return;
      updateCategory.mutate(
        { id: editingCategory.id, data },
        {
          onSuccess: () => {
            setEditingCategory(null);
          },
        },
      );
    },
    [editingCategory, updateCategory],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteCategory.mutate(id);
    },
    [deleteCategory],
  );

  const handleEdit = useCallback((category: TrackingCategory) => {
    setEditingCategory(category);
    setShowForm(false);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
  }, []);

  return (
    <PageContainer
      title="Tracking Categories"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Tracking Categories' },
      ]}
      actions={
        !showForm && !editingCategory ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(true)}
            data-testid="new-category-btn"
          >
            New Category
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Tracking Category</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
            <TrackingCategoryForm
              onSubmit={handleCreate}
              isLoading={createCategory.isPending}
            />
          </div>
        )}

        {editingCategory && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Tracking Category</h2>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
            <TrackingCategoryForm
              initialData={editingCategory}
              onSubmit={handleUpdate}
              isLoading={updateCategory.isPending}
            />
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-gray-500" data-testid="categories-loading">
            Loading tracking categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-gray-500" data-testid="categories-empty">
            No tracking categories found. Create one to get started.
          </div>
        ) : (
          <Table data-testid="categories-table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category: TrackingCategory) => (
                <TableRow key={category.id} data-testid={`category-row-${category.id}`}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-gray-500">
                    {category.options.map((o) => o.name).join(', ') || 'No options'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        data-testid={`edit-category-${category.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        data-testid={`delete-category-${category.id}`}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}
