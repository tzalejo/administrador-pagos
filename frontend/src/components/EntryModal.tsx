import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type PaymentEntry } from '@/lib/api';
import { parseArgentineNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShortcutBtn } from '@/components/ui/shortcut-button';
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

  const serviceRef = useRef<HTMLSelectElement>(null);
  const amountArsRef = useRef<HTMLInputElement>(null);
  const amountUsdRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const paymentMethodRef = useRef<HTMLSelectElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const saveWrapperRef = useRef<HTMLDivElement>(null);

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
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => { e.preventDefault(); serviceRef.current?.focus(); }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Agregar servicio'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Servicio *</Label>
            <select
              ref={serviceRef}
              value={serviceTemplateId ?? ''}
              onChange={(e) => applyTemplate(e.target.value)}
              className={SELECT_CLS}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  try { (e.currentTarget as any).showPicker(); } catch { /* */ }
                }
              }}
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
                ref={amountArsRef}
                value={amountArsRaw}
                onChange={(e) => setAmountArsRaw(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); amountUsdRef.current?.focus(); } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Monto USD</Label>
              <Input
                ref={amountUsdRef}
                value={amountUsdRaw}
                onChange={(e) => setAmountUsdRaw(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); statusRef.current?.focus(); } }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <select
              ref={statusRef}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={SELECT_CLS}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  try { (e.currentTarget as any).showPicker(); } catch { /* */ }
                }
              }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Vencimiento</Label>
              <Input
                ref={dueDateRef}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); paymentMethodRef.current?.focus(); } }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Medio de pago</Label>
              <select
                ref={paymentMethodRef}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={SELECT_CLS}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    try { (e.currentTarget as any).showPicker(); } catch { /* */ }
                  }
                }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <select
              ref={categoryRef}
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className={SELECT_CLS}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  try { (e.currentTarget as any).showPicker(); } catch { /* */ }
                }
              }}
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
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Detalles adicionales..."
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveWrapperRef.current?.querySelector('button')?.focus();
                }
              }}
            />
          </div>

          {mutation.isError && (
            <p className="text-destructive text-sm border border-destructive/30 bg-destructive/10 rounded-md px-3 py-2">
              {mutation.error instanceof Error ? mutation.error.message : 'Error al guardar'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <div ref={saveWrapperRef} className="flex-1">
              <ShortcutBtn
                shortcut="g"
                onClick={() => mutation.mutate()}
                disabled={!serviceTemplateId || mutation.isPending}
                className="w-full"
              >
                {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar'}
              </ShortcutBtn>
            </div>
            <ShortcutBtn shortcut="c" variant="ghost" onClick={onClose}>
              Cancelar
            </ShortcutBtn>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
