import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type PaymentEntry } from '@/lib/api';
import { formatARS, formatUSD, formatDate, formatPeriodLabel, getStatusConfig, cn } from '@/lib/utils';
import { EntryModal } from '@/components/EntryModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_BADGE: Record<string, string> = {
  paid: 'border-green-500/40 text-green-400 bg-green-500/10',
  pending: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
  no_charge: 'border-border text-muted-foreground bg-secondary/30',
  partial: 'border-primary/40 text-primary bg-primary/10',
};

const FILTERS = ['all', 'pending', 'paid', 'no_charge', 'partial'] as const;
const FILTER_LABELS: Record<string, string> = {
  all: 'Todos',
  pending: 'Pendiente',
  paid: 'Pagado',
  no_charge: 'Sin cargo',
  partial: 'Parcial',
};

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

  if (isLoading) return <div className="text-muted-foreground">Cargando...</div>;
  if (!period) return <div className="text-destructive">Período no encontrado</div>;

  const entries = period.entries ?? [];
  const filtered = filterStatus === 'all'
    ? entries
    : entries.filter((e) => e.status === filterStatus);

  const sorted = [...filtered].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.serviceTemplate.name.localeCompare(b.serviceTemplate.name),
  );

  const totalArs = entries
    .filter((e) => e.status !== 'no_charge')
    .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);

  const totalUsd = entries
    .filter((e) => e.status !== 'no_charge')
    .reduce((sum, e) => sum + Number(e.amountUsd ?? 0), 0);

  const pendingArs = entries
    .filter((e) => e.status === 'pending')
    .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);

  const paidCount = entries.filter((e) => e.status === 'paid').length;
  const pendingCount = entries.filter((e) => e.status === 'pending').length;

  function quickStatus(entry: PaymentEntry, status: string) {
    updateEntryMutation.mutate({ entryId: entry.id, data: { status } });
  }

  return (
    // Full viewport height — top section fixed, entries scroll within Card
    <div className="flex flex-col gap-3 max-w-3xl h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-3rem)]">

      {/* ── TOP SECTION (no scroll) ── */}
      <div className="shrink-0 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/periods"
              className="text-xs text-muted-foreground hover:text-primary inline-block transition-colors mb-0.5"
            >
              ← Períodos
            </Link>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {formatPeriodLabel(period.periodDate)}
            </h1>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="shrink-0">
            + Agregar
          </Button>
        </div>

        {/* Summary — compact stat row */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total ARS</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{formatARS(totalArs)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pendiente</p>
              <p className="text-sm font-bold text-yellow-400 mt-0.5">{formatARS(pendingArs)}</p>
            </CardContent>
          </Card>
          <Card className={totalUsd > 0 ? 'glow-sm' : ''}>
            <CardContent className="p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {totalUsd > 0 ? 'Total USD' : 'Servicios'}
              </p>
              <p className="text-sm font-bold mt-0.5">
                {totalUsd > 0 ? (
                  <span className="text-primary">{formatUSD(totalUsd)}</span>
                ) : (
                  <span className="text-foreground">
                    <span className="text-green-400">{paidCount}</span>
                    <span className="text-muted-foreground"> / {entries.length}</span>
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((s) => {
            const count = s === 'all' ? entries.length : entries.filter((e) => e.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1',
                  filterStatus === s
                    ? 'bg-primary/10 text-primary border-primary/40 glow-sm'
                    : 'bg-secondary text-muted-foreground border-transparent hover:border-border',
                )}
              >
                {FILTER_LABELS[s]}
                {count > 0 && (
                  <span className={cn(
                    'rounded-full px-1 text-[9px] font-bold',
                    filterStatus === s ? 'bg-primary/20' : 'bg-border/60',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ENTRIES (scrollable) ── */}
      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Sticky list header with context */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <span className="text-xs text-muted-foreground">
            {filtered.length} servicio{filtered.length !== 1 ? 's' : ''}
            {filterStatus !== 'all' && ` · ${FILTER_LABELS[filterStatus]}`}
          </span>
          {pendingCount > 0 && filterStatus === 'all' && (
            <span className="text-xs text-yellow-400">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No hay servicios en este filtro.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((entry) => {
                const status = getStatusConfig(entry.status);
                return (
                  <div key={entry.id} className="p-3 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.serviceTemplate.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 shrink-0', STATUS_BADGE[entry.status] ?? STATUS_BADGE.pending)}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {entry.amountArs != null && (
                            <span className="text-sm text-foreground">{formatARS(Number(entry.amountArs))}</span>
                          )}
                          {entry.amountUsd != null && (
                            <span className="text-sm text-primary">{formatUSD(Number(entry.amountUsd))}</span>
                          )}
                          {!entry.amountArs && !entry.amountUsd && entry.status !== 'no_charge' && (
                            <span className="text-xs text-muted-foreground">Sin monto</span>
                          )}
                          {entry.dueDate && (
                            <span className="text-xs text-muted-foreground">Vto: {formatDate(entry.dueDate)}</span>
                          )}
                          {entry.paymentMethod && (
                            <span className="text-xs text-muted-foreground">· {entry.paymentMethod}</span>
                          )}
                          {entry.notes && (
                            <span className="text-xs text-muted-foreground italic truncate max-w-[160px]">{entry.notes}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {entry.status !== 'paid' && entry.status !== 'no_charge' && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => quickStatus(entry, 'paid')}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            title="Marcar pagado"
                          >
                            ✓
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditingEntry(entry)}
                        >
                          ✎
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm('¿Eliminar este servicio?')) {
                              deleteEntryMutation.mutate(entry.id);
                            }
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

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
