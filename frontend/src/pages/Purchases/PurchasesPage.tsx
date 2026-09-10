import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { getApiErrorMessage } from '@/api/client';
import { itemsApi } from '@/api/items';
import { purchasesApi } from '@/api/purchases';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input, Select } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Table, type TableColumn } from '@/components/common/Table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { PurchaseEntry } from '@/types';
import { formatCurrency, formatDate, formatQuantity, todayIso } from '@/utils/format';

export function PurchasesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const { data: purchases, isLoading } = useQuery({ queryKey: ['purchases'], queryFn: purchasesApi.list });
  const { data: itemsPage } = useQuery({ queryKey: ['items-for-select'], queryFn: () => itemsApi.list({ page_size: 100 }) });

  const computedQuantity = useMemo(() => {
    const amt = parseFloat(totalAmount);
    const rate = parseFloat(ratePerUnit);
    if (!amt || !rate || rate <= 0) return null;
    return amt / rate;
  }, [totalAmount, ratePerUnit]);

  const createMutation = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setIsModalOpen(false);
      setItemId('');
      setSupplierName('');
      setTotalAmount('');
      setRatePerUnit('');
      setNote('');
      setFormError('');
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  function handleSubmit() {
    setFormError('');
    const amt = parseFloat(totalAmount);
    const rate = parseFloat(ratePerUnit);
    if (!amt || amt <= 0) return setFormError('Enter a valid total amount.');
    if (!rate || rate <= 0) return setFormError('Enter a valid rate per unit.');
    createMutation.mutate({
      item_id: itemId ? Number(itemId) : null,
      supplier_name: supplierName,
      total_amount: amt,
      rate_per_unit: rate,
      purchase_date: purchaseDate,
      note,
    });
  }

  const columns: TableColumn<PurchaseEntry>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDate(p.purchase_date) },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplier_name || '—' },
    { key: 'amount', header: 'Total Amount', align: 'right', render: (p) => formatCurrency(p.total_amount) },
    { key: 'rate', header: 'Rate / Unit', align: 'right', render: (p) => formatCurrency(p.rate_per_unit) },
    { key: 'qty', header: 'Quantity', align: 'right', render: (p) => <span className="font-semibold">{formatQuantity(p.quantity)}</span> },
  ];

  return (
    <DashboardLayout pageTitle="Purchases / Carton Entries">
      <Card
        noPadding
        title="Purchase Entries"
        subtitle="Enter total amount + rate — quantity is calculated automatically"
        action={
          <Button className='sm:max-w-max w-full' size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New Purchase
          </Button>
        }
      >
        <div className="p-4">
          <Table columns={columns} data={purchases ?? []} rowKey={(p) => p.id} isLoading={isLoading} emptyMessage="No purchases recorded yet." />
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Purchase (Carton)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
              Save Purchase
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Add to Item Stock (optional)"
            placeholder="No linked item — record purchase only"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            options={(itemsPage?.items ?? []).map((i) => ({ value: String(i.id), label: `${i.code} — ${i.name}` }))}
          />
          <Input label="Supplier Name (optional)" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Amount (Rs.)" type="number" min="0" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
            <Input label="Rate per Unit (Rs.)" type="number" min="0" step="0.01" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} required />
          </div>
          {computedQuantity !== null && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
              Calculated quantity: <span className="font-semibold">{formatQuantity(computedQuantity)}</span> units
            </p>
          )}
          <Input label="Purchase Date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {formError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</p>}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
