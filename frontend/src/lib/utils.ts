import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatARS(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatUSD(value: number | null | undefined): string {
  if (value == null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatPeriodLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

const CATEGORY_LABELS: Record<string, string> = {
  credit_card: 'Tarjeta de Crédito',
  insurance: 'Seguro',
  utilities: 'Servicios',
  taxes: 'Impuestos',
  rent: 'Alquiler',
  personal: 'Personal',
  investment: 'Inversión',
  other: 'Otros',
};

export function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

const STATUS_CONFIG = {
  paid: { label: 'Pagado', color: 'text-green-400', bg: 'bg-green-900/30' },
  pending: { label: 'Pendiente', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  no_charge: { label: 'Sin cargo', color: 'text-slate-400', bg: 'bg-slate-700/30' },
  partial: { label: 'Parcial', color: 'text-blue-400', bg: 'bg-blue-900/30' },
} as const;

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
}

export function parseArgentineNumber(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}
