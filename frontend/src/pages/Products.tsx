import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { api, Product } from '../api/client';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingSpinner';
import { formatCurrency } from '../api/client';

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.getProducts(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => api.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  }

  function openCreate() {
    setEditing(null);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormError('');
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      sku: form.get('sku') as string,
      description: (form.get('description') as string) || null,
      price: form.get('price') as string,
      stock_quantity: parseInt(form.get('stock_quantity') as string, 10),
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">{data?.total ?? 0} products in catalog</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="mb-6 relative">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="product-search"
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {!data?.items.length ? (
        <EmptyState
          title="No products found"
          description="Get started by adding your first product"
          action={
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Product
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">Name</th>
                <th className="px-6 py-3 font-medium text-slate-600">SKU</th>
                <th className="px-6 py-3 font-medium text-slate-600">Price</th>
                <th className="px-6 py-3 font-medium text-slate-600">Stock</th>
                <th className="px-6 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-slate-400 truncate max-w-xs">{product.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-500">{product.sku}</td>
                  <td className="px-6 py-3">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`badge ${
                        product.stock_quantity === 0
                          ? 'bg-red-100 text-red-700'
                          : product.stock_quantity <= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        title={`Edit ${product.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit {product.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this product?')) deleteMutation.mutate(product.id);
                        }}
                        aria-label={`Delete ${product.name}`}
                        title={`Delete ${product.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete {product.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title={editing ? 'Edit Product' : 'Add Product'} open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div>
            <label htmlFor="product-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="product-name"
              name="name"
              required
              defaultValue={editing?.name}
              placeholder="Enter product name"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="product-sku" className="mb-1 block text-sm font-medium text-slate-700">
              SKU
            </label>
            <input
              id="product-sku"
              name="sku"
              required
              disabled={!!editing}
              defaultValue={editing?.sku}
              placeholder="Enter SKU"
              className="input-field disabled:bg-slate-100"
            />
          </div>
          <div>
            <label htmlFor="product-description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              rows={2}
              defaultValue={editing?.description ?? ''}
              placeholder="Enter description"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-price" className="mb-1 block text-sm font-medium text-slate-700">
                Price ($)
              </label>
              <input
                id="product-price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={editing?.price}
                placeholder="0.00"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="product-stock" className="mb-1 block text-sm font-medium text-slate-700">
                Stock Quantity
              </label>
              <input
                id="product-stock"
                name="stock_quantity"
                type="number"
                min="0"
                required
                defaultValue={editing?.stock_quantity ?? 0}
                placeholder="0"
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
