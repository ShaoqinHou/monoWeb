import { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { TrackingCategoryForm } from '../../accounting/components/TrackingCategoryForm';
import { showToast } from '../../dashboard/components/ToastContainer';
import {
  useTrackingCategories,
  useCreateTrackingCategory,
  useUpdateTrackingCategory,
  useDeleteTrackingCategory,
} from '../../accounting/hooks/useTrackingCategories';
import type { TrackingCategory } from '../../accounting/hooks/useTrackingCategories';

export function TrackingCategoriesSettingsPage() {
  const { data: categories, isLoading, error } = useTrackingCategories();
  const createMutation = useCreateTrackingCategory();
  const updateMutation = useUpdateTrackingCategory();
  const deleteMutation = useDeleteTrackingCategory();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TrackingCategory | null>(null);

  const handleCreate = (data: { name: string; options: string[] }) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        showToast('success', 'Tracking category created');
        setShowAddDialog(false);
      },
      onError: (err: Error) => showToast('error', err.message || 'Failed to create category'),
    });
  };

  const handleUpdate = (data: { name: string; options: string[] }) => {
    if (!editingCategory) return;
    updateMutation.mutate(
      { id: editingCategory.id, data },
      {
        onSuccess: () => {
          showToast('success', 'Tracking category updated');
          setEditingCategory(null);
        },
        onError: (err: Error) => showToast('error', err.message || 'Failed to update category'),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => showToast('success', 'Tracking category deleted'),
      onError: (err: Error) => showToast('error', err.message || 'Failed to delete category'),
    });
  };

  return (
    <PageContainer
      title="Tracking Categories"
      actions={
        <Button onClick={() => setShowAddDialog(true)} data-testid="add-category-btn">
          Add Category
        </Button>
      }
    >
      {isLoading && <p className="text-gray-500" data-testid="loading-indicator">Loading tracking categories...</p>}

      {error && (
        <p className="text-red-600" data-testid="error-message">
          Failed to load tracking categories: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      )}

      {categories && categories.length === 0 && !isLoading && (
        <div className="text-center py-12" data-testid="empty-state">
          <p className="text-gray-500 text-lg">No tracking categories yet.</p>
          <p className="text-gray-400 mt-1">
            Create a tracking category to classify transactions by region, department, or any custom dimension.
          </p>
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="space-y-4" data-testid="categories-list">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-4"
              data-testid={`category-${category.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900" data-testid="category-name">
                  {category.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                    data-testid={`edit-category-${category.id}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    data-testid={`delete-category-${category.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {category.options.length > 0 ? (
                <div className="flex flex-wrap gap-2" data-testid="category-options">
                  {category.options.map((option) => (
                    <span
                      key={option.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {option.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No options defined</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Add Tracking Category"
      >
        <TrackingCategoryForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Tracking Category"
      >
        {editingCategory && (
          <TrackingCategoryForm
            initialData={editingCategory}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        )}
      </Dialog>
    </PageContainer>
  );
}
