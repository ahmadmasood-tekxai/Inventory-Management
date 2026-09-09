import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi, salesApi } from '@/api/items';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES, STOCK_MOVEMENT_COLORS, STOCK_MOVEMENT_LABELS } from '@/constants';
import type { StockMovement } from '@/types';
import { formatDateTime, formatQuantity, todayIso } from '@/utils/format';

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(itemId);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [saleDate, setSaleDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemsApi.getById(id),
    enabled: !Number.isNaN(id),
  });

  const saleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsSaleModalOpen(false);
      setQuantity('');
      setNote('');
      setFormError('');
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  function handleSubmitSale() {
    setFormError('');
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setFormError('Please enter a valid quantity greater than zero.');
      return;
    }
    saleMutation.mutate({ item_id: id, quantity: qty, sale_date: saleDate, note });
  }

  const movementColumns: TableColumn<StockMovement>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (m) => (
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STOCK_MOVEMENT_COLORS[m.movement_type]}`}>
          {STOCK_MOVEMENT_LABELS[m.movement_type]}
        </span>
      ),
    },
    {
      key: 'delta',
      header: 'Quantity Change',
      align: 'right',
      render: (m) => (
        <span className={m.quantity_delta < 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
          {m.quantity_delta > 0 ? '+' : ''}
          {formatQuantity(m.quantity_delta)}
        </span>
      ),
    },
    { key: 'note', header: 'Note', render: (m) => m.note || '—' },
    { key: 'when', header: 'Date & Time', render: (m) => formatDateTime(m.created_at) },
  ];

  if (isLoading || !item) {
    return (
      <DashboardLayout pageTitle="Item Detail">
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={`Item — ${item.code}`}>
      <button
        onClick={() => navigate(ROUTES.ITEMS)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Items
      </button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <p className="text-xs font-medium text-slate-400">Item</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">{item.code}</p>
          <p className="text-xs text-slate-400">{item.name}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-400">Remaining Stock</p>
          <p className={`mt-1 text-lg font-semibold ${item.is_low_stock ? 'text-rose-600' : 'text-slate-800'}`}>
            {formatQuantity(item.remaining_stock)} {item.unit}
          </p>
          {item.is_low_stock && <Badge tone="danger">Low Stock</Badge>}
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-400">Total Sold</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {formatQuantity(item.total_sold)} {item.unit}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-400">Total Purchased</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {formatQuantity(item.total_purchased)} {item.unit}
          </p>
        </Card>
      </div>

      <Card
        title="Stock History"
        subtitle="Full audit trail of every sale, purchase, and adjustment for this item"
        action={
          <Button size="sm" onClick={() => setIsSaleModalOpen(true)}>
            <Minus className="h-3.5 w-3.5" /> Record Sale
          </Button>
        }
        noPadding
      >
        <div className="p-4">
          <Table columns={movementColumns} data={item.movements} rowKey={(m) => m.id} emptyMessage="No stock movements yet." />
        </div>
      </Card>

      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title={`Record Sale — ${item.code}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSaleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitSale} isLoading={saleMutation.isPending}>
              Save Sale
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Currently <span className="font-semibold text-slate-700">{formatQuantity(item.remaining_stock)} {item.unit}</span> remaining.
            Enter quantity sold — remaining stock will update automatically.
          </p>
          <Input
            label={`Quantity Sold (${item.unit})`}
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            autoFocus
          />
          <Input label="Sale Date" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} required />
          <Input label="Note (optional)" placeholder="e.g. Sold to shop A" value={note} onChange={(e) => setNote(e.target.value)} />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
