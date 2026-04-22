import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { formatARS, formatUSD, formatPeriodLabel, getCategoryLabel } from '@/lib/utils';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const CHART_COLORS = {
  text: '#94a3b8',
  grid: '#334155',
  bar: '#3b82f6',
  barUsd: '#22c55e',
};

export function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: yearly = [], isLoading: loadingYearly } = useQuery({
    queryKey: ['reports-yearly', year],
    queryFn: () => api.reports.yearly(year),
  });

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['reports-categories', year],
    queryFn: () => api.reports.categories(year),
  });

  const totalArs = yearly.reduce((sum, p) => sum + Number(p.totalArs), 0);
  const totalUsd = yearly.reduce((sum, p) => sum + Number(p.totalUsd), 0);
  const avgArs = yearly.length ? totalArs / yearly.length : 0;

  const barData = yearly.map((p) => ({
    name: formatPeriodLabel(p.periodDate).split(' ')[0].slice(0, 3),
    ARS: Number(p.totalArs),
    USD: Number(p.totalUsd),
  }));

  const pieData = categories.map((c) => ({
    name: getCategoryLabel(c.category),
    value: Number(c.total),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
        >
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400">Total ARS {year}</p>
          <p className="text-lg font-bold text-white">{formatARS(totalArs)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400">Total USD {year}</p>
          <p className="text-lg font-bold text-green-400">{formatUSD(totalUsd)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400">Promedio mensual ARS</p>
          <p className="text-lg font-bold text-blue-400">{formatARS(avgArs)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="font-semibold text-white mb-4">Gastos por mes (ARS)</h2>
        {loadingYearly ? (
          <div className="h-48 flex items-center justify-center text-slate-400">Cargando...</div>
        ) : barData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
              <YAxis
                tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(val: number) => [formatARS(val), 'ARS']}
              />
              <Bar dataKey="ARS" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart + table */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-4">Por categoría</h2>
          {loadingCats ? (
            <div className="h-48 flex items-center justify-center text-slate-400">Cargando...</div>
          ) : pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: CHART_COLORS.text, fontSize: 11 }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
                  formatter={(val: number) => [formatARS(val), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-white">Totales por categoría</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {categories.map((c, i) => (
              <div key={c.category} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-300">{getCategoryLabel(c.category)}</span>
                </div>
                <span className="text-sm text-white font-medium">{formatARS(Number(c.total))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Detalle mensual {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-2.5 text-slate-400 font-medium">Período</th>
                <th className="px-4 py-2.5 text-slate-400 font-medium text-right">ARS</th>
                <th className="px-4 py-2.5 text-slate-400 font-medium text-right">USD</th>
                <th className="px-4 py-2.5 text-slate-400 font-medium text-right">Pagados</th>
                <th className="px-4 py-2.5 text-slate-400 font-medium text-right">Pendientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {yearly.map((p) => (
                <tr key={p.periodId} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-white">
                    {p.label || formatPeriodLabel(p.periodDate)}
                  </td>
                  <td className="px-4 py-3 text-right text-white">{formatARS(p.totalArs)}</td>
                  <td className="px-4 py-3 text-right text-green-400">
                    {p.totalUsd > 0 ? formatUSD(p.totalUsd) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">{p.paidCount}</td>
                  <td className="px-4 py-3 text-right text-yellow-400">{p.pendingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
