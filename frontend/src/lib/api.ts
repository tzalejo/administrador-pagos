const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message ?? 'Error en la petición');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: { id: string; email: string; name: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),
    me: () => request<{ id: string; email: string; name: string }>('/auth/me'),
  },

  templates: {
    list: () => request<ServiceTemplate[]>('/service-templates'),
    create: (data: Partial<ServiceTemplate>) =>
      request<ServiceTemplate>('/service-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ServiceTemplate>) =>
      request<ServiceTemplate>(`/service-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/service-templates/${id}`, { method: 'DELETE' }),
  },

  periods: {
    list: () => request<Period[]>('/periods'),
    get: (id: string) => request<Period>(`/periods/${id}`),
    create: (data: { periodDate: string; label?: string; notes?: string }) =>
      request<Period>('/periods', { method: 'POST', body: JSON.stringify(data) }),
    cloneTemplates: (id: string) =>
      request<Period>(`/periods/${id}/clone-templates`, { method: 'POST' }),
    update: (id: string, data: Partial<Period>) =>
      request<Period>(`/periods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/periods/${id}`, { method: 'DELETE' }),
  },

  entries: {
    list: (periodId: string) => request<PaymentEntry[]>(`/periods/${periodId}/entries`),
    create: (periodId: string, data: Partial<PaymentEntry>) =>
      request<PaymentEntry>(`/periods/${periodId}/entries`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<PaymentEntry>) =>
      request<PaymentEntry>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  },

  reports: {
    yearly: (year: number) => request<YearlySummaryItem[]>(`/reports/yearly?year=${year}`),
    serviceHistory: (name: string) =>
      request<ServiceHistoryItem[]>(`/reports/service/${encodeURIComponent(name)}`),
    categories: (year: number) =>
      request<CategoryTotal[]>(`/reports/categories?year=${year}`),
  },
};

export interface ServiceTemplate {
  id: string;
  name: string;
  category: string;
  isRecurring: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Period {
  id: string;
  periodDate: string;
  label: string;
  notes: string;
  entries: PaymentEntry[];
  createdAt: string;
}

export interface PaymentEntry {
  id: string;
  serviceName: string;
  serviceTemplateId: string;
  category: string;
  amountArs: number | null;
  amountUsd: number | null;
  paymentMethod: string;
  dueDate: string | null;
  status: string;
  notes: string;
  sortOrder: number;
}

export interface YearlySummaryItem {
  periodId: string;
  periodDate: string;
  label: string;
  totalArs: number;
  totalUsd: number;
  pendingCount: number;
  paidCount: number;
  entryCount: number;
}

export interface ServiceHistoryItem {
  periodId: string;
  periodDate: string;
  label: string;
  amountArs: number | null;
  amountUsd: number | null;
  status: string;
  paymentMethod: string;
  notes: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
}
