import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi, salesApi } from '@/api/items';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
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

  const { data: sales, isLoading } = useQuery({ queryKey: ['sales'], queryFn: () => salesApi.list() });
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
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Sale
          </Button>
        }
      >
        <div className="p-4">
          <Table columns={columns} data={sales ?? []} rowKey={(s) => s.id} isLoading={isLoading} emptyMessage="No sales recorded yet." />
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
