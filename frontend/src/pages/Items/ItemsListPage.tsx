import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Image as ImageIcon, Plus, Search, Trash2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi } from '@/api/items';
import { itemImageApi } from '@/api/itemImage';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { API_BASE_URL, ROUTES, UNIT_OPTIONS } from '@/constants';
import { useToast } from '@/context/ToastContext';
import type { ItemCreateInput, ItemUpdateInput, ItemWithStock } from '@/types';
import { formatQuantity } from '@/utils/format';

const emptyForm: ItemCreateInput = {
  code: '',
  name: '',
  unit: 'pcs',
  opening_stock: 0,
  low_stock_threshold: 10,
  notes: '',
};

export function ItemsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ItemCreateInput>(emptyForm);
  const [formError, setFormError] = useState('');
  const [createImage, setCreateImage] = useState<File | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editItem, setEditItem] = useState<ItemWithStock | null>(null);
  const [editForm, setEditForm] = useState<ItemUpdateInput>({});
  const [editError, setEditError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ItemWithStock | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['items', search, lowStockOnly, page],
    queryFn: () => itemsApi.list({ search: search || undefined, low_stock_only: lowStockOnly, page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: itemsApi.create,
    onSuccess: async (newItem) => {
      // If an image was selected during creation, upload it now
      if (createImage) {
        try {
          await itemImageApi.upload(newItem.id, createImage);
        } catch (err) {
          toast.error('Item created, but failed to upload image.');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsCreateOpen(false);
      setForm(emptyForm);
      setCreateImage(null);
      setFormError('');
      toast.success('Item created successfully!');
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err));
      toast.error('Failed to create item.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ItemUpdateInput }) =>
      itemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setEditItem(null);
      setEditError('');
      toast.success('Item updated successfully!');
    },
    onError: (err) => {
      setEditError(getApiErrorMessage(err));
      toast.error('Failed to update item.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: itemsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
      setDeleteTarget(null);
      toast.success('Item deleted.');
    },
    onError: () => toast.error('Failed to delete item.'),
  });

  function openEdit(item: ItemWithStock, e: React.MouseEvent) {
    e.stopPropagation();
    setEditItem(item);
    setEditForm({ name: item.name, unit: item.unit, opening_stock: item.opening_stock, low_stock_threshold: item.low_stock_threshold, notes: item.notes ?? '' });
    setEditError('');
  }

  function openDelete(item: ItemWithStock, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(item);
  }

  const columns: TableColumn<ItemWithStock>[] = [
    {
      key: 'code',
      header: 'IMAGE & CODE',
      render: (i) => (
        <div className="flex items-center gap-3">
          {i.image_path ? (
            <img
              src={`${API_BASE_URL.replace('/api/v1', '')}/uploads/items/${i.image_path.split(/[/\\]/).pop()}`}
              alt={i.name}
              className="h-9 w-9 rounded-md object-cover border border-slate-200 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200">
              <ImageIcon className="h-4 w-4 text-slate-400" />
            </div>
          )}
          <span className="font-semibold text-slate-800">{i.code}</span>
        </div>
      ),
    },
    { key: 'name', header: 'Name', render: (i) => i.name },
    { key: 'unit', header: 'Unit', render: (i) => i.unit },
    {
      key: 'remaining',
      header: 'Remaining Stock',
      align: 'right',
      render: (i) => (
        <span className={i.is_low_stock ? 'font-semibold text-rose-600' : 'font-semibold text-slate-800'}>
          {formatQuantity(i.remaining_stock)}
        </span>
      ),
    },
    { key: 'sold', header: 'Total Sold', align: 'right', render: (i) => formatQuantity(i.total_sold) },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (i) => (i.is_low_stock ? <Badge tone="danger">Low Stock</Badge> : <Badge tone="success">OK</Badge>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => openEdit(i, e)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            title="Edit item"
            aria-label="Edit item"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => openDelete(i, e)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Delete item"
            aria-label="Delete item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Items & Stock">
      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-xs">
              <Input
                placeholder="Search by code or name…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Low stock only
            </label>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="p-4">
          <Table
            columns={columns}
            data={data?.items ?? []}
            rowKey={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No items yet — click 'Add Item' to create your first one."
            onRowClick={(row) => navigate(ROUTES.ITEM_DETAIL(row.id))}
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateImage(null);
        }}
        title="Add New Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setIsCreateOpen(false);
              setCreateImage(null);
            }}>Cancel</Button>
            <Button onClick={() => { setFormError(''); createMutation.mutate(form); }} isLoading={createMutation.isPending}>
              Save Item
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Image Upload Area */}
          <div className="flex items-center gap-4">
            <div
              className="group relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50 transition-colors"
              onClick={() => createFileInputRef.current?.click()}
            >
              {createImage ? (
                <img
                  src={URL.createObjectURL(createImage)}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-slate-400 group-hover:text-brand-500" />
                  <span className="mt-1 text-[10px] font-medium text-slate-500 group-hover:text-brand-600">Photo</span>
                </>
              )}
              {createImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-slate-700">Item Image (Optional)</h3>
              <p className="text-xs text-slate-500">Upload a photo for easy identification.</p>
              {createImage && (
                <button
                  type="button"
                  onClick={() => setCreateImage(null)}
                  className="mt-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                >
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={createFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setCreateImage(file);
                if (createFileInputRef.current) createFileInputRef.current.value = '';
              }}
            />
          </div>

          <Input label="Item Code" placeholder='e.g. "1500C"' value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="Item Name" placeholder="e.g. Cotton 1500C" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Unit" value={form.unit ?? 'pcs'} onChange={(e) => setForm({ ...form, unit: e.target.value })} options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))} />
            <Input label="Opening Stock" type="number" min="0" value={form.opening_stock} onChange={(e) => setForm({ ...form, opening_stock: parseFloat(e.target.value) || 0 })} />
          </div>
          <Input
            label="Low Stock Alert Threshold"
            type="number"
            min="0"
            hint="Alert fires when remaining stock falls to or below this number"
            value={form.low_stock_threshold}
            onChange={(e) => setForm({ ...form, low_stock_threshold: parseFloat(e.target.value) || 0 })}
          />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit — ${editItem?.code}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editItem!.id, payload: editForm })}
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              onClick={() => deleteMutation.mutate(deleteTarget!.id)}
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
            <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>{' '}
            (<span className="font-mono">{deleteTarget?.code}</span>)?
          </p>
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            ⚠️ This will permanently delete the item and all its stock movement history. This cannot be undone.
          </p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
