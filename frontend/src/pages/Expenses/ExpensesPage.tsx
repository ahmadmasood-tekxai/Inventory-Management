import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

import { getApiErrorMessage } from '@/api/client';
import { expensesApi } from '@/api/expenses';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Expense } from '@/types';
import { formatCurrency, formatDate, todayIso } from '@/utils/format';

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', search, startDate, endDate, page],
    queryFn: () => expensesApi.list({ search: search || undefined, start_date: startDate || undefined, end_date: endDate || undefined, page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setFormError('');
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  function handleSubmit() {
    setFormError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setFormError('Enter a valid amount greater than zero.');
    createMutation.mutate({ amount: amt, description, expense_date: expenseDate });
  }

  const columns: TableColumn<Expense>[] = [
    { key: 'date', header: 'Date', render: (e) => formatDate(e.expense_date) },
    { key: 'amount', header: 'Amount', render: (e) => <span className="font-medium">{formatCurrency(e.amount)}</span> },
    { key: 'desc', header: 'Description', render: (e) => e.description || '—' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <button
          onClick={() => deleteMutation.mutate(e.id)}
          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Delete expense"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Expenses">
      <Card noPadding>

        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Filters */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:flex-1">
            {/* Search */}
            <div className="w-full sm:flex-1 lg:max-w-none">
              <Input
                placeholder="Search description..."
                value={search}
                className="w-full"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Start Date */}
            <div className="w-full sm:w-[160px] shrink-0">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>

            {/* End Date */}
            <div className="w-full sm:w-[160px] shrink-0">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Add Expense */}
          <div className="w-full lg:w-auto">
            <Button
              className="w-full lg:w-auto lg:min-w-[140px]"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
        <div className="p-4">
          <Table
            columns={columns}
            data={data?.items ?? []}
            rowKey={(e) => e.id}
            isLoading={isLoading}
            emptyMessage="No expenses found."
          />
          {data && data.total_pages > 1 && (
            <Pagination
              page={data.page}
              pageSize={data.page_size}
              total={data.total}
              totalPages={data.total_pages}
              onPageChange={setPage}
            />
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              Save Expense
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
          <Input label="Amount (Rs.)" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          <Input label="Description (optional)" placeholder="e.g. Tea, transport, labour" value={description} onChange={(e) => setDescription(e.target.value)} />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
