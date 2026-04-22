import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatARS, formatUSD, formatDate, getStatusConfig } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

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
    return <div className="text-slate-400 p-4">Cargando...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Buen día, {user?.name}</h1>
        <p className="text-slate-400 text-sm mt-1">
          {latestPeriod
            ? `Último período: ${formatDate(latestPeriod.periodDate)}`
            : 'No hay períodos registrados'}
        </p>
      </div>

      {!latestPeriod ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <p className="text-slate-400 mb-4">No tenés períodos registrados todavía.</p>
          <Link
            to="/periods"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Crear primer período
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total ARS" value={formatARS(totalArs)} color="text-white" />
            {totalUsd > 0 && (
              <StatCard label="Total USD" value={formatUSD(totalUsd)} color="text-green-400" />
            )}
            <StatCard
              label="Pendientes"
              value={String(pendingEntries.length)}
              color="text-yellow-400"
            />
            <StatCard
              label="Pagados"
              value={String(paidEntries.length)}
              color="text-green-400"
            />
          </div>

          {/* Pending entries */}
          {pendingEntries.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="font-semibold text-white">Pendientes de pago</h2>
                <Link
                  to={`/periods/${latestPeriod.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Ver todo →
                </Link>
              </div>
              <div className="divide-y divide-slate-700">
                {pendingEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-white font-medium">{entry.serviceName}</p>
                      {entry.dueDate && (
                        <p className="text-xs text-slate-400">Vto: {formatDate(entry.dueDate)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {entry.amountArs && (
                        <p className="text-sm text-white">{formatARS(entry.amountArs)}</p>
                      )}
                      {entry.amountUsd && (
                        <p className="text-xs text-green-400">{formatUSD(entry.amountUsd)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent periods */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="font-semibold text-white">Períodos recientes</h2>
              <Link to="/periods" className="text-xs text-blue-400 hover:text-blue-300">
                Ver todos →
              </Link>
            </div>
            <div className="divide-y divide-slate-700">
              {periods.slice(0, 5).map((period) => {
                const total = period.entries
                  .filter((e) => e.status !== 'no_charge')
                  .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);
                const pending = period.entries.filter((e) => e.status === 'pending').length;
                return (
                  <Link
                    key={period.id}
                    to={`/periods/${period.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">
                        {period.label || formatDate(period.periodDate)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {period.entries.length} servicios
                        {pending > 0 && (
                          <span className="text-yellow-400 ml-2">{pending} pendientes</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm text-white">{formatARS(total)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
