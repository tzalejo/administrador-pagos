import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type PaymentEntry } from '@/lib/api';
import { parseArgentineNumber } from '@/lib/utils';

interface Props {
  periodId: string;
  entry?: PaymentEntry;
  onClose: () => void;
  onSaved: () => void;
}

const PAYMENT_METHODS = [
  { value: '', label: 'Sin especificar' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'bbva', label: 'BBVA' },
  { value: 'debit_auto', label: 'Débito automático' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'otro', label: 'Otro' },
];

const CATEGORIES = [
  { value: '', label: 'Sin categoría' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'utilities', label: 'Servicios' },
  { value: 'taxes', label: 'Impuestos' },
  { value: 'rent', label: 'Alquiler' },
  { value: 'personal', label: 'Personal' },
  { value: 'investment', label: 'Inversión' },
  { value: 'other', label: 'Otros' },
];

export function EntryModal({ periodId, entry, onClose, onSaved }: Props) {
  const isEdit = !!entry;

  const [serviceName, setServiceName] = useState(entry?.serviceName ?? '');
  const [amountArsRaw, setAmountArsRaw] = useState(
    entry?.amountArs != null ? String(entry.amountArs) : '',
  );
  const [amountUsdRaw, setAmountUsdRaw] = useState(
    entry?.amountUsd != null ? String(entry.amountUsd) : '',
  );
  const [paymentMethod, setPaymentMethod] = useState(entry?.paymentMethod ?? '');
  const [dueDate, setDueDate] = useState(entry?.dueDate ?? '');
  const [status, setStatus] = useState(entry?.status ?? 'pending');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [category, setCategory] = useState(entry?.category ?? '');
  const [useTemplate, setUseTemplate] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        serviceName,
        category: category || undefined,
        amountArs: parseArgentineNumber(amountArsRaw),
        amountUsd: parseArgentineNumber(amountUsdRaw),
        paymentMethod: paymentMethod || undefined,
        dueDate: dueDate || undefined,
        status,
        notes: notes || undefined,
      };
      return isEdit ? api.entries.update(entry!.id, data) : api.entries.create(periodId, data);
    },
    onSuccess: onSaved,
  });

  function applyTemplate(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    setServiceName(t.name);
    setCategory(t.category ?? '');
    setUseTemplate(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/80">
      <div className="bg-slate-800 border border-slate-700 rounded-t-2xl md:rounded-xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="font-semibold text-white">{isEdit ? 'Editar servicio' : 'Agregar servicio'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Usar servicio predefinido</label>
              <select
                onChange={(e) => applyTemplate(e.target.value)}
                defaultValue=""
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-300">Nombre del servicio *</label>
            <input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="ej: naranja, seguro, alquiler..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Monto ARS</label>
              <input
                value={amountArsRaw}
                onChange={(e) => setAmountArsRaw(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Monto USD</label>
              <input
                value={amountUsdRaw}
                onChange={(e) => setAmountUsdRaw(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-300">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="no_charge">Sin cargo (-)</option>
              <option value="partial">Parcial</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Vencimiento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Medio de pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-300">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-300">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm">
              {mutation.error instanceof Error ? mutation.error.message : 'Error al guardar'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => mutation.mutate()}
              disabled={!serviceName || mutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar'}
            </button>
            <button
              onClick={onClose}
              className="px-4 text-slate-400 hover:text-white rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
