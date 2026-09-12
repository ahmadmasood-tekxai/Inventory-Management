import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi, salesApi } from '@/api/items';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { SaleEntry } from '@/types';
import { formatDate, formatQuantity } from '@/utils/format';
import { todayIso } from '@/utils/format';

export function SalesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saleDate, setSaleDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['sales', search, startDate, endDate, page],
    queryFn: () => salesApi.list({ search: search || undefined, start_date: startDate || undefined, end_date: endDate || undefined, page, page_size: pageSize })
  });
  const { data: itemsPage } = useQuery({ queryKey: ['items-for-select'], queryFn: () => itemsApi.list({ page_size: 100 }) });

  const saleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsModalOpen(false);
      setItemId('');
      setQuantity('');
      setNote('');
      setFormError('');
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  function handleSubmit() {
    setFormError('');
    const qty = parseFloat(quantity);
    if (!itemId) return setFormError('Please select an item.');
    if (!qty || qty <= 0) return setFormError('Enter a valid quantity.');
    saleMutation.mutate({ item_id: Number(itemId), quantity: qty, sale_date: saleDate, note });
  }

  const columns: TableColumn<SaleEntry>[] = [
    { key: 'date', header: 'Date', render: (s) => formatDate(s.sale_date) },
    { key: 'item', header: 'Item', render: (s) => `${s.item_code} — ${s.item_name}` },
    { key: 'qty', header: 'Quantity Sold', align: 'right', render: (s) => formatQuantity(s.quantity) },
    { key: 'remaining', header: 'Remaining After', align: 'right', render: (s) => formatQuantity(s.remaining_stock_after) },
    { key: 'note', header: 'Note', render: (s) => s.note || '—' },
  ];

  return (
    <DashboardLayout pageTitle="Sales">
      <Card
        noPadding
        title="Sale Entries"
        subtitle="Quantity sold per item — no pricing, pure stock ledger"
        action={
          <Button className='sm:max-w-max w-full' size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Sale
          </Button>
        }
      >

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>

          {/* Date Filters */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              placeholder="Start Date"
              className="w-full sm:w-[160px]"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              placeholder="End Date"
              className="w-full sm:w-[160px]"
            />
          </div>
        </div>


        <div className="p-4">
          <Table columns={columns} data={data?.items ?? []} rowKey={(s) => s.id} isLoading={isLoading} emptyMessage="No sales recorded yet." />
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
        title="Record New Sale"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={saleMutation.isPending}>
              Save Sale
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Item"
            placeholder="Select an item…"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            options={(itemsPage?.items ?? []).map((i) => ({
              value: String(i.id),
              label: `${i.code} — ${i.name} (${formatQuantity(i.remaining_stock)} ${i.unit} left)`,
            }))}
          />
          <Input label="Quantity Sold" type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          <Input label="Sale Date" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
