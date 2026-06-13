import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api, Order, Product, Customer, formatCurrency, formatDate } from '../api/client';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingSpinner';

interface OrderLine {
  product_id: number;
  quantity: number;
}

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([{ product_id: 0, quantity: 1 }]);
  const [notes, setNotes] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: api.getOrders,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });

  const createMutation = useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Order['status'] }) =>
      api.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  function closeModal() {
    setModalOpen(false);
    setFormError('');
    setCustomerId('');
    setLines([{ product_id: 0, quantity: 1 }]);
    setNotes('');
  }

  function addLine() {
    setLines([...lines, { product_id: 0, quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof OrderLine, value: number) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  function getProductStock(productId: number): number {
    return products?.items.find((p) => p.id === productId)?.stock_quantity ?? 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setFormError('Please select a customer');
      return;
    }
    const validLines = lines.filter((l) => l.product_id > 0 && l.quantity > 0);
    if (!validLines.length) {
      setFormError('Add at least one product');
      return;
    }

    for (const line of validLines) {
      const stock = getProductStock(line.product_id);
      if (line.quantity > stock) {
        const product = products?.items.find((p) => p.id === line.product_id);
        setFormError(`Insufficient stock for ${product?.name}: only ${stock} available`);
        return;
      }
    }

    createMutation.mutate({
      customer_id: parseInt(customerId, 10),
      items: validLines,
      notes: notes || undefined,
    });
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-slate-500">{data?.total ?? 0} orders placed</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </div>

      {!data?.items.length ? (
        <EmptyState
          title="No orders yet"
          description="Create your first order to see it here"
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Create Order
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.items.map((order) => (
            <div key={order.id} className="card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                    <span className={`badge ${statusColors[order.status]}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.customer_name} &middot; {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(order.total_amount)}</p>
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <select
                      id={`order-status-${order.id}`}
                      aria-label={`Update status for order #${order.id}`}
                      title={`Update status for order #${order.id}`}
                      value={order.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          id: order.id,
                          status: e.target.value as Order['status'],
                        })
                      }
                      className="input-field w-auto text-sm"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium">SKU</th>
                      <th className="py-2 font-medium">Qty</th>
                      <th className="py-2 font-medium">Unit Price</th>
                      <th className="py-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2 font-mono text-slate-500">{item.product_sku}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">{formatCurrency(item.unit_price)}</td>
                        <td className="py-2 font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal title="Create Order" open={modalOpen} onClose={closeModal} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <ErrorMessage message={formError} />}

          <div>
            <label htmlFor="order-customer" className="mb-1 block text-sm font-medium text-slate-700">
              Customer
            </label>
            <select
              id="order-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Select a customer...</option>
              {customers?.items.map((c: Customer) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Order Items</label>
              <button type="button" onClick={addLine} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label htmlFor={`order-product-${index}`} className="sr-only">
                      Product for item {index + 1}
                    </label>
                    <select
                      id={`order-product-${index}`}
                      value={line.product_id}
                      onChange={(e) => updateLine(index, 'product_id', parseInt(e.target.value, 10))}
                      className="input-field"
                    >
                      <option value={0}>Select product...</option>
                      {products?.items.map((p: Product) => (
                        <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                          {p.name} ({p.sku}) — Stock: {p.stock_quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label htmlFor={`order-quantity-${index}`} className="sr-only">
                      Quantity for item {index + 1}
                    </label>
                    <input
                      id={`order-quantity-${index}`}
                      type="number"
                      min={1}
                      max={line.product_id ? getProductStock(line.product_id) : undefined}
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      placeholder="Qty"
                      className="input-field"
                    />
                  </div>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      aria-label={`Remove item ${index + 1}`}
                      title={`Remove item ${index + 1}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Remove item {index + 1}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="order-notes" className="mb-1 block text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add order notes"
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              Place Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
