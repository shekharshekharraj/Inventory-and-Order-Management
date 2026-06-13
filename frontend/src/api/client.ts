export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  product_name: string | null;
  product_sku: string | null;
}

export interface Order {
  id: number;
  customer_id: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string | null;
  items: OrderItem[];
}

export interface DashboardStats {
  total_products: number;
  total_customers: number;
  total_orders: number;
  total_revenue: string;
  low_stock_products: number;
  out_of_stock_products: number;
}

export interface InventoryAlert {
  product_id: number;
  product_name: string;
  sku: string;
  stock_quantity: number;
  status: 'low_stock' | 'out_of_stock';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body.detail === 'string'
        ? body.detail
        : body.detail?.message || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  getStats: () => request<DashboardStats>('/api/v1/dashboard/stats'),
  getInventoryAlerts: () => request<InventoryAlert[]>('/api/v1/dashboard/inventory-alerts'),

  getProducts: (search?: string) =>
    request<PaginatedResponse<Product>>(`/api/v1/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createProduct: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) =>
    request<Product>('/api/v1/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request<void>(`/api/v1/products/${id}`, { method: 'DELETE' }),

  getCustomers: (search?: string) =>
    request<PaginatedResponse<Customer>>(`/api/v1/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) =>
    request<Customer>('/api/v1/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: Partial<Customer>) =>
    request<Customer>(`/api/v1/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: number) => request<void>(`/api/v1/customers/${id}`, { method: 'DELETE' }),

  getOrders: () => request<PaginatedResponse<Order>>('/api/v1/orders'),
  createOrder: (data: { customer_id: number; items: { product_id: number; quantity: number }[]; notes?: string }) =>
    request<Order>('/api/v1/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: number, status: Order['status']) =>
    request<Order>(`/api/v1/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
