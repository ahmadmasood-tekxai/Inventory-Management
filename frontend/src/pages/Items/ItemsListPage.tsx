import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi } from '@/api/items';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES, UNIT_OPTIONS } from '@/constants';
import type { ItemCreateInput, ItemWithStock } from '@/types';
import { formatQuantity } from '@/utils/format';

const emptyForm: ItemCreateInput = {
  code: '',
  name: '',
  unit: 'pcs',
  opening_stock: 0,
  low_stock_threshold: 5,
  notes: '',
};

export function ItemsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ItemCreateInput>(emptyForm);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['items', search, lowStockOnly],
    queryFn: () => itemsApi.list({ search: search || undefined, low_stock_only: lowStockOnly, page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsModalOpen(false);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  function handleSubmit() {
    setFormError('');
    createMutation.mutate(form);
  }

  const columns: TableColumn<ItemWithStock>[] = [
    { key: 'code', header: 'Code', render: (i) => <span className="font-medium text-slate-800">{i.code}</span> },
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
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Low stock only
            </label>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
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
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              Save Item
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Item Code"
            placeholder='e.g. "1500C"'
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <Input
            label="Item Name"
            placeholder="e.g. Cotton 1500C"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              options={UNIT_OPTIONS.map((u) => ({ value: u, label: u }))}
            />
            <Input
              label="Opening Stock"
              type="number"
              min="0"
              value={form.opening_stock}
              onChange={(e) => setForm({ ...form, opening_stock: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="Low Stock Threshold"
            type="number"
            min="0"
            hint="You'll be alerted when remaining stock falls to or below this number"
            value={form.low_stock_threshold}
            onChange={(e) => setForm({ ...form, low_stock_threshold: parseFloat(e.target.value) || 0 })}
          />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
