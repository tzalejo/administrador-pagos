import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type PaymentEntry } from '@/lib/api';
import { parseArgentineNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'no_charge', label: 'Sin cargo (-)' },
  { value: 'partial', label: 'Parcial' },
];

const SELECT_CLS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

export function EntryModal({ periodId, entry, onClose, onSaved }: Props) {
  const isEdit = !!entry;

  const [serviceTemplateId, setServiceTemplateId] = useState<number | null>(entry?.serviceTemplate?.id ?? null);
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
  const [categoryId, setCategoryId] = useState<number | null>(entry?.category?.id ?? null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        serviceTemplateId: serviceTemplateId!,
        categoryId: categoryId ?? null,
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
    const t = templates.find((t) => String(t.id) === templateId);
    if (!t) return;
    setServiceTemplateId(t.id);
    setCategoryId(t.category?.id ?? null);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Agregar servicio'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Servicio *</Label>
            <select
              value={serviceTemplateId ?? ''}
              onChange={(e) => applyTemplate(e.target.value)}
              className={SELECT_CLS}
            >
              <option value="">Seleccionar servicio...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Monto ARS</Label>
              <Input
                value={amountArsRaw}
                onChange={(e) => setAmountArsRaw(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Monto USD</Label>
              <Input
                value={amountUsdRaw}
                onChange={(e) => setAmountUsdRaw(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLS}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Vencimiento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Medio de pago</Label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={SELECT_CLS}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className={SELECT_CLS}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Detalles adicionales..."
              className="resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-destructive text-sm border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
              {mutation.error instanceof Error ? mutation.error.message : 'Error al guardar'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!serviceTemplateId || mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
