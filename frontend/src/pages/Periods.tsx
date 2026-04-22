import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatARS, formatDate, formatPeriodLabel } from '@/lib/utils';

export function PeriodsPage() {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [withTemplates, setWithTemplates] = useState(true);
  const qc = useQueryClient();

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['periods'],
    queryFn: api.periods.list,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const period = await api.periods.create({
        periodDate: date,
        label: label || formatPeriodLabel(date),
      });
      if (withTemplates) {
        await api.periods.cloneTemplates(period.id);
      }
      return period;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['periods'] });
      setShowForm(false);
      setDate('');
      setLabel('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.periods.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['periods'] }),
  });

  if (isLoading) return <div className="text-slate-400">Cargando...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Períodos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo período
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-4">Nuevo período</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Fecha del período *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Etiqueta (opcional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ej: Marzo 2026"
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={withTemplates}
                onChange={(e) => setWithTemplates(e.target.checked)}
                className="rounded"
              />
              Cargar servicios predefinidos automáticamente
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!date || createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear período'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {periods.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <p className="text-slate-400">No hay períodos registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((period) => {
            const totalArs = period.entries
              .filter((e) => e.status !== 'no_charge')
              .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);
            const pending = period.entries.filter((e) => e.status === 'pending').length;
            const paid = period.entries.filter((e) => e.status === 'paid').length;

            return (
              <div
                key={period.id}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
              >
                <Link
                  to={`/periods/${period.id}`}
                  className="flex items-start justify-between p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {period.label || formatPeriodLabel(period.periodDate)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(period.periodDate)} · {period.entries.length} servicios
                    </p>
                    <div className="flex gap-3 mt-1.5">
                      {paid > 0 && (
                        <span className="text-xs text-green-400">{paid} pagados</span>
                      )}
                      {pending > 0 && (
                        <span className="text-xs text-yellow-400">{pending} pendientes</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatARS(totalArs)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ARS</p>
                  </div>
                </Link>
                <div className="border-t border-slate-700 px-4 py-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este período y todos sus pagos?')) {
                        deleteMutation.mutate(period.id);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
