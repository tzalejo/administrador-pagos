import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatARS, formatUSD, formatDate, formatPeriodLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: api.periods.list,
  });

  const latestPeriod = periods[0];
  const entries = latestPeriod?.entries ?? [];

  const totalArs = entries
    .filter((e) => e.status !== 'no_charge')
    .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);

  const totalUsd = entries
    .filter((e) => e.status !== 'no_charge')
    .reduce((sum, e) => sum + Number(e.amountUsd ?? 0), 0);

  const pendingEntries = entries.filter((e) => e.status === 'pending');
  const paidEntries = entries.filter((e) => e.status === 'paid');

  if (isLoading) {
    return <div className="text-muted-foreground p-4">Cargando...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Buen día, <span className="glow-text">{user?.name}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {latestPeriod
            ? `Último período: ${formatPeriodLabel(latestPeriod.periodDate)}`
            : 'No hay períodos registrados'}
        </p>
      </div>

      {!latestPeriod ? (
        <Card className="text-center py-8">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">No tenés períodos registrados todavía.</p>
            <Button asChild>
              <Link to="/periods">Crear primer período</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total ARS" value={formatARS(totalArs)} />
            {totalUsd > 0 && (
              <StatCard label="Total USD" value={formatUSD(totalUsd)} accent />
            )}
            <StatCard label="Pendientes" value={String(pendingEntries.length)} warn />
            <StatCard label="Pagados" value={String(paidEntries.length)} accent />
          </div>

          {pendingEntries.length > 0 && (
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pendientes de pago</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/periods/${latestPeriod.id}`}>Ver todo →</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        {entry.serviceTemplate.name}
                      </p>
                      {entry.dueDate && (
                        <p className="text-xs text-muted-foreground">Vto: {formatDate(entry.dueDate)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {entry.amountArs && (
                        <p className="text-sm text-foreground">{formatARS(Number(entry.amountArs))}</p>
                      )}
                      {entry.amountUsd && (
                        <p className="text-xs text-accent">{formatUSD(Number(entry.amountUsd))}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Períodos recientes</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/periods">Ver todos →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {periods.slice(0, 5).map((period) => {
                const total = period.entries
                  .filter((e) => e.status !== 'no_charge')
                  .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);
                const pending = period.entries.filter((e) => e.status === 'pending').length;
                return (
                  <Link
                    key={period.id}
                    to={`/periods/${period.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-foreground font-medium">
                        {period.label || formatPeriodLabel(period.periodDate)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        {period.entries.length} servicios
                        {pending > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500/40 text-yellow-400">
                            {pending} pendientes
                          </Badge>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-foreground font-medium">{formatARS(total)}</p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <Card className={accent ? 'glow-sm' : ''}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p
          className={`text-lg font-bold ${
            warn ? 'text-yellow-400' : accent ? 'text-primary' : 'text-foreground'
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
