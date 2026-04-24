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
      request<{ access_token: string; user: { id: number; email: string; name: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      ),
    me: () => request<{ id: number; email: string; name: string }>('/auth/me'),
  },

  categories: {
    list: () => request<Category[]>('/categories'),
  },

  templates: {
    list: () => request<ServiceTemplate[]>('/service-templates'),
    create: (data: CreateTemplatePayload) =>
      request<ServiceTemplate>('/service-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<CreateTemplatePayload>) =>
      request<ServiceTemplate>(`/service-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/service-templates/${id}`, { method: 'DELETE' }),
  },

  periods: {
    list: () => request<Period[]>('/periods'),
    get: (id: string) => request<Period>(`/periods/${id}`),
    create: (data: { periodDate: string; notes?: string }) =>
      request<Period>('/periods', { method: 'POST', body: JSON.stringify(data) }),
    cloneTemplates: (id: string) =>
      request<Period>(`/periods/${id}/clone-templates`, { method: 'POST' }),
    update: (id: string, data: Partial<Period>) =>
      request<Period>(`/periods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/periods/${id}`, { method: 'DELETE' }),
  },

  entries: {
    create: (periodId: string, data: CreateEntryPayload) =>
      request<PaymentEntry>(`/periods/${periodId}/entries`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<CreateEntryPayload>) =>
      request<PaymentEntry>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  },

  reports: {
    yearly: (year: number) => request<YearlySummaryItem[]>(`/reports/yearly?year=${year}`),
    serviceHistory: (name: string) =>
      request<ServiceHistoryItem[]>(`/reports/service/${encodeURIComponent(name)}`),
    categories: (year: number) =>
      request<CategoryTotal[]>(`/reports/categories?year=${year}`),
  },
};

export interface Category {
  id: number;
  name: string;
  label: string;
}

export interface ServiceTemplate {
  id: number;
  name: string;
  category: Category | null;
  isRecurring: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateTemplatePayload {
  name?: string;
  categoryId?: number | null;
  isRecurring?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Period {
  id: number;
  periodDate: string;
  notes: string;
  entries: PaymentEntry[];
  createdAt: string;
}

export interface PaymentEntry {
  id: number;
  serviceTemplate: ServiceTemplate;
  category: Category | null;
  amountArs: number | null;
  amountUsd: number | null;
  paymentMethod: string;
  dueDate: string | null;
  status: string;
  notes: string;
  sortOrder: number;
}

export interface CreateEntryPayload {
  serviceTemplateId: number;
  categoryId?: number | null;
  amountArs?: number | null;
  amountUsd?: number | null;
  paymentMethod?: string;
  dueDate?: string | null;
  status?: string;
  notes?: string;
  sortOrder?: number;
}

export interface YearlySummaryItem {
  periodId: number;
  periodDate: string;
  totalArs: number;
  totalUsd: number;
  pendingCount: number;
  paidCount: number;
  entryCount: number;
}

export interface ServiceHistoryItem {
  periodId: number;
  periodDate: string;
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
