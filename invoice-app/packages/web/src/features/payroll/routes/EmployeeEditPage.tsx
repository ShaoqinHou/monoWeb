import { useNavigate, useParams } from '@tanstack/react-router';
import { PageContainer } from '../../../components/layout/PageContainer';
import { EmployeeForm } from '../components/EmployeeForm';
import { useEmployee, useUpdateEmployee } from '../hooks/usePayroll';
import { showToast } from '../../dashboard/components/ToastContainer';
import type { CreateEmployeeInput } from '../types';

export function EmployeeEditPage() {
  const { employeeId } = useParams({ from: '/payroll/employees/$employeeId/edit' });
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(employeeId);
  const updateEmployee = useUpdateEmployee();

  const handleSubmit = (data: CreateEmployeeInput) => {
    updateEmployee.mutate(
      { id: employeeId, updates: data },
      {
        onSuccess: () => {
          showToast('success', 'Employee updated');
          navigate({ to: '/payroll/employees/$employeeId', params: { employeeId } });
        },
        onError: (error: Error) => {
          showToast('error', error.message || 'Failed to update employee');
        },
      },
    );
  };

  const handleCancel = () => {
    navigate({ to: '/payroll/employees/$employeeId', params: { employeeId } });
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Employee"
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Employees', href: '/payroll/employees' },
          { label: 'Loading...' },
        ]}
      >
        <div className="text-[#6b7280]" data-testid="employee-edit-loading">Loading employee...</div>
      </PageContainer>
    );
  }

  if (!employee) {
    return (
      <PageContainer
        title="Employee Not Found"
        breadcrumbs={[
          { label: 'Payroll', href: '/payroll' },
          { label: 'Employees', href: '/payroll/employees' },
          { label: 'Not Found' },
        ]}
      >
        <div className="text-[#6b7280]">Employee not found.</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit ${employee.firstName} ${employee.lastName}`}
      breadcrumbs={[
        { label: 'Payroll', href: '/payroll' },
        { label: 'Employees', href: '/payroll/employees' },
        {
          label: `${employee.firstName} ${employee.lastName}`,
          href: `/payroll/employees/${employeeId}`,
        },
        { label: 'Edit' },
      ]}
    >
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900" data-testid="edit-employee-heading">Edit Employee</h2>
          <EmployeeForm
            employee={employee}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={updateEmployee.isPending}
          />
        </div>
      </div>
    </PageContainer>
  );
}
