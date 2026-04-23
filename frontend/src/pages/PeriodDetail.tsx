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

  const filters = ['all', 'pending', 'paid', 'no_charge', 'partial'];
  const filterLabels: Record<string, string> = {
    all: 'Todos',
    pending: 'Pendiente',
    paid: 'Pagado',
    no_charge: 'Sin cargo',
    partial: 'Parcial',
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/periods" className="text-xs text-muted-foreground hover:text-primary mb-1 inline-block transition-colors">
            ← Períodos
          </Link>
          <h1 className="text-xl font-bold text-foreground">
            {period.label || formatPeriodLabel(period.periodDate)}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate(period.periodDate)}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="shrink-0">
          + Agregar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total ARS</p>
            <p className="text-base font-bold text-foreground">{formatARS(totalArs)}</p>
          </CardContent>
        </Card>
        {totalUsd > 0 && (
          <Card className="glow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total USD</p>
              <p className="text-base font-bold text-primary">{formatUSD(totalUsd)}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Pendiente ARS</p>
            <p className="text-base font-bold text-yellow-400">{formatARS(pendingArs)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all border',
              filterStatus === s
                ? 'bg-primary/10 text-primary border-primary/40 glow-sm'
                : 'bg-secondary text-muted-foreground border-transparent hover:border-border',
            )}
          >
            {filterLabels[s]}
          </button>
        ))}
      </div>

      {/* Entries */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No hay servicios en este período.</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {filtered
              .sort((a, b) => a.sortOrder - b.sortOrder || a.serviceTemplate.name.localeCompare(b.serviceTemplate.name))
              .map((entry) => {
                const status = getStatusConfig(entry.status);
                return (
                  <div key={entry.id} className="p-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.serviceTemplate.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5', STATUS_BADGE[entry.status] ?? STATUS_BADGE.pending)}
                          >
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {entry.amountArs != null && (
                            <span className="text-sm text-foreground">{formatARS(Number(entry.amountArs))}</span>
                          )}
                          {entry.amountUsd != null && (
                            <span className="text-sm text-primary">+ {formatUSD(Number(entry.amountUsd))}</span>
                          )}
                          {!entry.amountArs && !entry.amountUsd && entry.status !== 'no_charge' && (
                            <span className="text-xs text-muted-foreground">Sin monto</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {entry.dueDate && (
                            <span className="text-xs text-muted-foreground">Vto: {formatDate(entry.dueDate)}</span>
                          )}
                          {entry.paymentMethod && (
                            <span className="text-xs text-muted-foreground">via {entry.paymentMethod}</span>
                          )}
                          {entry.notes && (
                            <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">{entry.notes}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
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
