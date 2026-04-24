import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatARS, formatPeriodLabel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const NOW = new Date();

export function PeriodsPage() {
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear] = useState(NOW.getFullYear());
  const [withTemplates, setWithTemplates] = useState(true);
  const qc = useQueryClient();

  const periodDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const periodLabel = formatPeriodLabel(periodDate);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: api.periods.list,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const period = await api.periods.create({ periodDate });
      if (withTemplates) await api.periods.cloneTemplates(String(period.id));
      return period;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['periods'] });
      setShowForm(false);
    },
  });

  const createError = createMutation.error?.message ?? null;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.periods.remove(String(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  });

  if (isLoading) return <div className="text-muted-foreground">Cargando...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Períodos</h1>
        <Button onClick={() => setShowForm(!showForm)}>+ Nuevo período</Button>
      </div>

      {showForm && (
        <Card className="glow-border">
          <CardHeader>
            <CardTitle className="text-base">Nuevo período</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Período</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(Math.min(12, Math.max(1, Number(e.target.value))))}
                  className="w-20 text-center"
                  placeholder="MM"
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-24 text-center"
                  placeholder="AAAA"
                />
                <span className="text-sm text-primary font-medium">{periodLabel}</span>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={withTemplates}
                onChange={(e) => setWithTemplates(e.target.checked)}
                className="rounded accent-primary"
              />
              Cargar servicios predefinidos automáticamente
            </label>
            {createError && (
              <p className="text-xs text-destructive">{createError}</p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!month || !year || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear período'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {periods.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">No hay períodos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((period) => {
            const totalArs = period.entries
              .filter((e) => e.status !== 'no_charge')
              .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);
            const pending = period.entries.filter((e) => e.status === 'pending').length;
            const paid = period.entries.filter((e) => e.status === 'paid').length;

            return (
              <Card key={period.id} className="overflow-hidden hover:glow-sm transition-all">
                <Link
                  to={`/periods/${period.id}`}
                  className="flex items-start justify-between p-5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-foreground">
                      {formatPeriodLabel(period.periodDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {period.entries.length} servicios
                    </p>
                    <div className="flex gap-2 mt-1">
                      {paid > 0 && (
                        <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-400">
                          {paid} pagados
                        </Badge>
                      )}
                      {pending > 0 && (
                        <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-400">
                          {pending} pendientes
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatARS(totalArs)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ARS</p>
                  </div>
                </Link>
                <div className="border-t border-border px-5 py-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                    onClick={() => {
                      if (confirm('¿Eliminar este período y todos sus pagos?')) {
                        deleteMutation.mutate(period.id);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
