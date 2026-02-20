import { useNavigate } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { EmployeeForm } from '../components/EmployeeForm';
import { useAddEmployee } from '../hooks/usePayroll';
import { showToast } from '../../dashboard/components/ToastContainer';
import type { CreateEmployeeInput } from '../types';

export function EmployeeCreatePage() {
  const navigate = useNavigate();
  const addEmployee = useAddEmployee();

  const handleSubmit = (data: CreateEmployeeInput) => {
    addEmployee.mutate(data, {
      onSuccess: () => {
        showToast('success', 'Employee created');
        navigate({ to: '/payroll/employees' });
      },
      onError: (error: Error) => {
        showToast('error', error.message || 'Failed to create employee');
      },
    });
  };

  const handleCancel = () => {
    navigate({ to: '/payroll/employees' });
  };

  return (
    <PageContainer
      title="New Employee"
      breadcrumbs={[
        { label: 'Payroll', href: '/payroll' },
        { label: 'Employees', href: '/payroll/employees' },
        { label: 'New Employee' },
      ]}
    >
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Employee Details</h2>
          <EmployeeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={addEmployee.isPending}
          />
        </div>
      </div>
    </PageContainer>
  );
}
