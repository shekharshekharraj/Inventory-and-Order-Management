import { useQuery } from '@tanstack/react-query';
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { api, formatCurrency } from '../api/client';
import StatCard from '../components/StatCard';
import { LoadingSpinner, ErrorMessage } from '../components/LoadingSpinner';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.getStats,
  });

  const { data: alerts } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: api.getInventoryAlerts,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={(error as Error).message} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Overview of your inventory and orders</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats!.total_products}
          icon={<Package className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={stats!.total_customers}
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <StatCard
          title="Total Orders"
          value={stats!.total_orders}
          icon={<ShoppingCart className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats!.total_revenue)}
          icon={<DollarSign className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {(stats!.low_stock_products > 0 || stats!.out_of_stock_products > 0) && (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Inventory Alerts</h2>
            <span className="badge bg-amber-100 text-amber-700">
              {stats!.low_stock_products + stats!.out_of_stock_products} items need attention
            </span>
          </div>

          <div className="card overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-600">Product</th>
                  <th className="px-6 py-3 font-medium text-slate-600">SKU</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Stock</th>
                  <th className="px-6 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts?.map((alert) => (
                  <tr key={alert.product_id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">{alert.product_name}</td>
                    <td className="px-6 py-3 font-mono text-slate-500">{alert.sku}</td>
                    <td className="px-6 py-3">{alert.stock_quantity}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`badge ${
                          alert.status === 'out_of_stock'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {alert.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
