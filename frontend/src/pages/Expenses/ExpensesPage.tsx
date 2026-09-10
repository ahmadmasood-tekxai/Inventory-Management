import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

import { getApiErrorMessage } from '@/api/client';
import { expensesApi } from '@/api/expenses';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Expense } from '@/types';
import { formatCurrency, formatDate, todayIso } from '@/utils/format';

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['expense-summary', selectedDate],
    queryFn: () => expensesApi.dailySummary(selectedDate),
  });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  function handleSubmit() {
    setFormError('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setFormError('Enter a valid amount greater than zero.');
    createMutation.mutate({ amount: amt, description, expense_date: selectedDate });
  }

  const columns: TableColumn<Expense>[] = [
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
    <DashboardLayout pageTitle="Daily Expenses">
      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className='w-full'>

          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full sm:max-w-[180px]" />
          </div>
          <div className="flex sm:flex-row sm:justify-end flex-col w-full items-center gap-4">
            <div className="w-full sm:max-w-max">
              <p className="text-xs text-slate-400">Total for {formatDate(selectedDate)}</p>
              <p className="text-lg font-semibold text-slate-800">{formatCurrency(summary?.total_expenses ?? 0)}</p>
            </div>
            <Button className='w-full sm:max-w-max' onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
        </div>
        <div className="p-4">
          <Table
            columns={columns}
            data={summary?.entries ?? []}
            rowKey={(e) => e.id}
            isLoading={isLoading}
            emptyMessage="No expenses logged for this date."
          />
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add Expense — ${formatDate(selectedDate)}`}
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
          <Input label="Amount (Rs.)" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus />
          <Input label="Description (optional)" placeholder="e.g. Tea, transport, labour" value={description} onChange={(e) => setDescription(e.target.value)} />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
