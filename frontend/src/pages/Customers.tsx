import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { api, Customer } from '../api/client';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingSpinner';

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.getCustomers(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) => api.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      closeModal();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError('');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get('name') as string,
      email: form.get('email') as string,
      phone: (form.get('phone') as string) || null,
      address: (form.get('address') as string) || null,
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
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-slate-500">{data?.total ?? 0} registered customers</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      <div className="mb-6 relative">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="customer-search"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {!data?.items.length ? (
        <EmptyState
          title="No customers found"
          description="Add your first customer to start creating orders"
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Customer
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-600">Name</th>
                <th className="px-6 py-3 font-medium text-slate-600">Email</th>
                <th className="px-6 py-3 font-medium text-slate-600">Phone</th>
                <th className="px-6 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium">{customer.name}</td>
                  <td className="px-6 py-3 text-slate-500">{customer.email}</td>
                  <td className="px-6 py-3 text-slate-500">{customer.phone || '—'}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditing(customer); setModalOpen(true); }}
                        aria-label={`Edit ${customer.name}`}
                        title={`Edit ${customer.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Edit {customer.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this customer?')) deleteMutation.mutate(customer.id);
                        }}
                        aria-label={`Delete ${customer.name}`}
                        title={`Delete ${customer.name}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete {customer.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title={editing ? 'Edit Customer' : 'Add Customer'} open={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <ErrorMessage message={formError} />}
          <div>
            <label htmlFor="customer-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="customer-name"
              name="name"
              required
              defaultValue={editing?.name}
              placeholder="Enter customer name"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="customer-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="customer-email"
              name="email"
              type="email"
              required
              defaultValue={editing?.email}
              placeholder="Enter email address"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="customer-phone"
              name="phone"
              defaultValue={editing?.phone ?? ''}
              placeholder="Enter phone number"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="customer-address" className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              id="customer-address"
              name="address"
              rows={2}
              defaultValue={editing?.address ?? ''}
              placeholder="Enter address"
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
