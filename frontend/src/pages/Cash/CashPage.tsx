import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';

import { getApiErrorMessage } from '@/api/client';
import { cashApi } from '@/api/cash';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Pagination } from '@/components/common/Pagination';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { CashBookWithBalance } from '@/types';
import { formatCurrency, formatDate, todayIso } from '@/utils/format';

export function CashPage() {
  const queryClient = useQueryClient();
  const [bookDate, setBookDate] = useState(todayIso());
  const [openingCash, setOpeningCash] = useState('');
  const [formError, setFormError] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: historyData, isLoading } = useQuery({ 
    queryKey: ['cash-book-history', startDate, endDate, page], 
    queryFn: () => cashApi.list({ start_date: startDate || undefined, end_date: endDate || undefined, page, page_size: pageSize }) 
  });
  const { data: todayEntry } = useQuery({
    queryKey: ['cash-book', bookDate],
    queryFn: () => cashApi.getByDate(bookDate),
    retry: false,
  });

  const setCashMutation = useMutation({
    mutationFn: cashApi.setOpeningCash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-book-history'] });
      queryClient.invalidateQueries({ queryKey: ['cash-book'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOpeningCash('');
      setFormError('');
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  function handleSubmit() {
    setFormError('');
    const cash = parseFloat(openingCash);
    if (Number.isNaN(cash) || cash < 0) return setFormError('Enter a valid cash amount.');
    setCashMutation.mutate({ book_date: bookDate, opening_cash: cash });
  }

  const columns: TableColumn<CashBookWithBalance>[] = [
    { key: 'date', header: 'Date', render: (c) => formatDate(c.book_date) },
    { key: 'opening', header: 'Opening Cash', align: 'right', render: (c) => formatCurrency(c.opening_cash) },
    { key: 'expenses', header: 'Total Expenses', align: 'right', render: (c) => formatCurrency(c.total_expenses) },
    {
      key: 'closing',
      header: 'Closing Balance',
      align: 'right',
      render: (c) => <span className="font-semibold text-emerald-700">{formatCurrency(c.closing_balance)}</span>,
    },
  ];

  return (
    <DashboardLayout pageTitle="Cash Book">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1" title="Set Opening Cash">
          <div className="space-y-4">
            <Input label="Date" type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
            <Input
              label="Opening Cash (Rs.)"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 200000"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
            />
            {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
            <Button fullWidth onClick={handleSubmit} isLoading={setCashMutation.isPending}>
              <Wallet className="h-4 w-4" /> Save Opening Cash
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2" title={`Summary — ${formatDate(bookDate)}`}>
          {todayEntry ? (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-400">Opening Cash</p>
                <p className="mt-1 text-lg font-semibold text-slate-800">{formatCurrency(todayEntry.opening_cash)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Expenses</p>
                <p className="mt-1 text-lg font-semibold text-rose-600">{formatCurrency(todayEntry.total_expenses)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Closing Balance</p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(todayEntry.closing_balance)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No opening cash set for this date yet.</p>
          )}
        </Card>
      </div>

      <Card title="Cash Book History" noPadding>
        <div className="flex gap-3 border-b border-slate-100 p-4 sm:flex-row flex-col">
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} placeholder="Start Date" className="sm:max-w-[150px]" />
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} placeholder="End Date" className="sm:max-w-[150px]" />
        </div>
        <div className="p-4">
          <Table columns={columns} data={historyData?.items ?? []} rowKey={(c) => c.id} isLoading={isLoading} emptyMessage="No cash entries yet." />
          {historyData && historyData.total_pages > 1 && (
            <Pagination
              page={historyData.page}
              pageSize={historyData.page_size}
              total={historyData.total}
              totalPages={historyData.total_pages}
              onPageChange={setPage}
            />
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
