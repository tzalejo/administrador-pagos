import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type PaymentEntry } from '@/lib/api';
import { formatARS, formatUSD, formatDate, formatPeriodLabel, getStatusConfig, cn } from '@/lib/utils';
import { EntryModal } from '@/components/EntryModal';

export function PeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [editingEntry, setEditingEntry] = useState<PaymentEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: period, isLoading } = useQuery({
    queryKey: ['period', id],
    queryFn: () => api.periods.get(id!),
    enabled: !!id,
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ entryId, data }: { entryId: number; data: { status: string } }) =>
      api.entries.update(entryId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['period', id] }),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: number) => api.entries.remove(entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['period', id] }),
  });

  if (isLoading) return <div className="text-slate-400">Cargando...</div>;
  if (!period) return <div className="text-red-400">Período no encontrado</div>;

  const entries = period.entries ?? [];
  const filtered = filterStatus === 'all' ? entries : entries.filter((e) => e.status === filterStatus);

  const totalArs = entries
    .filter((e) => e.status !== 'no_charge')
    .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);

  const totalUsd = entries
    .filter((e) => e.status !== 'no_charge')
    .reduce((sum, e) => sum + Number(e.amountUsd ?? 0), 0);

  const pendingArs = entries
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);

  function quickStatus(entry: PaymentEntry, status: string) {
    updateEntryMutation.mutate({ entryId: entry.id, data: { status } });
  }


  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/periods" className="text-xs text-slate-400 hover:text-white mb-1 inline-block">
            ← Períodos
          </Link>
          <h1 className="text-xl font-bold text-white">
            {period.label || formatPeriodLabel(period.periodDate)}
          </h1>
          <p className="text-sm text-slate-400">{formatDate(period.periodDate)}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          + Agregar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
          <p className="text-xs text-slate-400">Total ARS</p>
          <p className="text-base font-bold text-white">{formatARS(totalArs)}</p>
        </div>
        {totalUsd > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
            <p className="text-xs text-slate-400">Total USD</p>
            <p className="text-base font-bold text-green-400">{formatUSD(totalUsd)}</p>
          </div>
        )}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
          <p className="text-xs text-slate-400">Pendiente ARS</p>
          <p className="text-base font-bold text-yellow-400">{formatARS(pendingArs)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'paid', 'no_charge', 'partial'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
            )}
          >
            {s === 'all' ? 'Todos' : getStatusConfig(s).label}
          </button>
        ))}
      </div>

      {/* Entries table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm p-6 text-center">No hay servicios en este período.</p>
        ) : (
          <div className="divide-y divide-slate-700">
            {filtered
              .sort((a, b) => a.sortOrder - b.sortOrder || a.serviceTemplate.name.localeCompare(b.serviceTemplate.name))
              .map((entry) => {
                const status = getStatusConfig(entry.status);
                return (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-white truncate">{entry.serviceTemplate.name}</p>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', status.bg, status.color)}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {entry.amountArs != null && (
                            <span className="text-sm text-white">{formatARS(Number(entry.amountArs))}</span>
                          )}
                          {entry.amountUsd != null && (
                            <span className="text-sm text-green-400">+ {formatUSD(Number(entry.amountUsd))}</span>
                          )}
                          {!entry.amountArs && !entry.amountUsd && entry.status !== 'no_charge' && (
                            <span className="text-xs text-slate-500">Sin monto</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {entry.dueDate && (
                            <span className="text-xs text-slate-400">Vto: {formatDate(entry.dueDate)}</span>
                          )}
                          {entry.paymentMethod && (
                            <span className="text-xs text-slate-400">via {entry.paymentMethod}</span>
                          )}
                          {entry.notes && (
                            <span className="text-xs text-slate-500 italic truncate max-w-[200px]">{entry.notes}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {entry.status !== 'paid' && entry.status !== 'no_charge' && (
                          <button
                            onClick={() => quickStatus(entry, 'paid')}
                            className="text-xs bg-green-900/40 text-green-400 hover:bg-green-900/60 px-2 py-1 rounded transition-colors"
                            title="Marcar pagado"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este servicio?')) {
                              deleteEntryMutation.mutate(entry.id);
                            }

                          }}
                          className="text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 px-2 py-1 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {(showAddModal || editingEntry) && (
        <EntryModal
          periodId={id!}
          entry={editingEntry ?? undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['period', id] });
            setShowAddModal(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
