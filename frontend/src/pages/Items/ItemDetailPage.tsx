import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Edit2, Minus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi, salesApi } from '@/api/items';
import { itemImageApi } from '@/api/itemImage';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input, Select } from '@/components/common/Input';
import { Loader } from '@/components/common/Loader';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES, STOCK_MOVEMENT_COLORS, STOCK_MOVEMENT_LABELS, UNIT_OPTIONS } from '@/constants';
import { useToast } from '@/context/ToastContext';
import type { ItemUpdateInput, StockMovement } from '@/types';
import { formatDateTime, formatQuantity, todayIso } from '@/utils/format';
import { API_BASE_URL } from '@/constants';

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const id = Number(itemId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sale modal state
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [saleDate, setSaleDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [saleError, setSaleError] = useState('');

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ItemUpdateInput>({});
  const [editError, setEditError] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Pagination for movements
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Image uploading state
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      setIsSaleModalOpen(false);
      setQuantity('');
      setNote('');
      setSaleError('');
      toast.success('Sale recorded successfully!');
    },
    onError: (err) => {
      setSaleError(getApiErrorMessage(err));
      toast.error('Failed to record sale.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ItemUpdateInput) => itemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsEditOpen(false);
      setEditError('');
      toast.success('Item updated!');
    },
    onError: (err) => {
      setEditError(getApiErrorMessage(err));
      toast.error('Failed to update item.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => itemsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      toast.success('Item deleted.');
      navigate(ROUTES.ITEMS);
    },
    onError: () => toast.error('Failed to delete item.'),
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      await itemImageApi.upload(id, file);
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success('Image uploaded!');
    } catch {
      toast.error('Failed to upload image. Only JPEG, PNG, WebP, or GIF allowed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openEdit() {
    if (!item) return;
    setEditForm({ name: item.name, unit: item.unit, opening_stock: item.opening_stock, low_stock_threshold: item.low_stock_threshold, notes: item.notes ?? '' });
    setEditError('');
    setIsEditOpen(true);
  }

  function handleSubmitSale() {
    setSaleError('');
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setSaleError('Please enter a valid quantity greater than zero.');
      return;
    }
    saleMutation.mutate({ item_id: id, quantity: qty, sale_date: saleDate, note });
  }

  // Build image URL from stored path
  const imageUrl = item?.image_path
    ? `${API_BASE_URL.replace('/api/v1', '')}/uploads/items/${item.image_path.split(/[/\\]/).pop()}`
    : null;

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
      render: (m) => {
        const delta = m.quantity_delta;
        return (
          <span className={delta < 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
            {delta > 0 ? '+' : ''}
            {formatQuantity(delta)}
          </span>
        );
      },
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

  const pagedMovements = item.movements.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout pageTitle={`Item — ${item.code}`}>
      <button
        onClick={() => navigate(ROUTES.ITEMS)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Items
      </button>

      {/* Item header with image */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Image / Upload area */}
        <div className="relative flex-shrink-0">
          <div
            className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 hover:border-brand-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload item image"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                <Camera className="h-6 w-6" />
                <span className="text-xs">Add Photo</span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Item info + actions */}
        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{item.name}</h2>
              <p className="text-sm text-slate-500 font-mono">{item.code}</p>
              {item.is_low_stock && (
                <Badge tone="danger" className="mt-1">Low Stock</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={openEdit}>
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" onClick={() => setIsSaleModalOpen(true)}>
                <Minus className="h-3.5 w-3.5" /> Record Sale
              </Button>
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
          {item.notes && (
            <p className="mt-2 text-sm text-slate-500">{item.notes}</p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <Card>
          <p className="text-xs font-medium text-slate-400">Remaining Stock</p>
          <p className={`mt-1 text-lg font-semibold ${item.is_low_stock ? 'text-rose-600' : 'text-slate-800'}`}>
            {formatQuantity(item.remaining_stock)} {item.unit}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-400">Opening Stock</p>
          <p className="mt-1 text-lg font-semibold text-slate-800">
            {formatQuantity(item.opening_stock)} {item.unit}
          </p>
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

      {/* Movement History */}
      <Card
        title="Stock History"
        subtitle="Full audit trail of every sale, purchase, and adjustment"
        noPadding
      >
        <div className="p-4">
          <Table columns={movementColumns} data={pagedMovements} rowKey={(m) => m.id} emptyMessage="No stock movements yet." />
          {item.movements.length > pageSize && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={item.movements.length}
              totalPages={Math.ceil(item.movements.length / pageSize)}
              onPageChange={setPage}
            />
          )}
        </div>
      </Card>

      {/* Sale Modal */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title={`Record Sale — ${item.code}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSaleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitSale} isLoading={saleMutation.isPending}>Save Sale</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Currently <span className="font-semibold text-slate-700">{formatQuantity(item.remaining_stock)} {item.unit}</span> remaining.
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
          {saleError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{saleError}</p>}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit — ${item.code}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editForm)} isLoading={updateMutation.isPending}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Item Name" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <div className="grid grid-cols-1 gap-3">
            <Select label="Unit" value={editForm.unit ?? 'pcs'} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} />
            <Input label="Opening Stock" type="number" min="0" value={editForm.opening_stock ?? 0} onChange={(e) => setEditForm({ ...editForm, opening_stock: parseFloat(e.target.value) || 0 })} />
            <Input
              label="Low Stock Threshold"
              type="number"
              min="0"
              value={editForm.low_stock_threshold ?? 10}
              onChange={(e) => setEditForm({ ...editForm, low_stock_threshold: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input label="Notes (optional)" value={editForm.notes ?? ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
          {editError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{editError}</p>}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              isLoading={deleteMutation.isPending}
              className="!bg-rose-600 hover:!bg-rose-700"
            >
              Yes, Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">{item.name}</span>?
          </p>
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            ⚠️ This will permanently delete the item and all its stock movement history.
          </p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
