import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { formatARS, formatUSD, formatPeriodLabel, getCategoryLabel } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const POSEIDON_COLORS = [
  'oklch(0.6 0.2 250)',
  'oklch(0.55 0.18 260)',
  'oklch(0.65 0.15 240)',
  'oklch(0.5 0.2 255)',
  'oklch(0.7 0.12 245)',
  'oklch(0.45 0.18 230)',
  'oklch(0.75 0.1 265)',
  'oklch(0.4 0.15 250)',
];

const CHART = {
  text: 'oklch(0.65 0 0)',
  grid: 'oklch(0.28 0.1 250)',
  bar: 'oklch(0.6 0.2 250)',
  tooltip: { background: 'oklch(0.1 0.02 250)', border: 'oklch(0.28 0.1 250)' },
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

  const selectCls = 'bg-input border border-input rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-ring';

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectCls}>
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total ARS {year}</p>
            <p className="text-lg font-bold text-foreground">{formatARS(totalArs)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total USD {year}</p>
            <p className="text-lg font-bold text-primary">{formatUSD(totalUsd)}</p>
          </CardContent>
        </Card>
        <Card className="glow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Promedio mensual ARS</p>
            <p className="text-lg font-bold text-primary">{formatARS(avgArs)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Gastos por mes (ARS)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loadingYearly ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Cargando...</div>
          ) : barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="name" tick={{ fill: CHART.text, fontSize: 11 }} />
                <YAxis
                  tick={{ fill: CHART.text, fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ background: CHART.tooltip.background, border: `1px solid ${CHART.tooltip.border}`, borderRadius: 8 }}
                  labelStyle={{ color: 'oklch(0.95 0.02 220)' }}
                  formatter={(val: number) => [formatARS(val), 'ARS']}
                />
                <Bar dataKey="ARS" fill={CHART.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Por categoría</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingCats ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Cargando...</div>
            ) : pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={POSEIDON_COLORS[i % POSEIDON_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ color: CHART.text, fontSize: 11 }}>{v}</span>} />
                  <Tooltip
                    contentStyle={{ background: CHART.tooltip.background, border: `1px solid ${CHART.tooltip.border}`, borderRadius: 8 }}
                    formatter={(val: number) => [formatARS(val), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Totales por categoría</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {categories.map((c, i) => (
              <div key={c.category} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: POSEIDON_COLORS[i % POSEIDON_COLORS.length] }} />
                  <span className="text-sm text-muted-foreground">{getCategoryLabel(c.category)}</span>
                </div>
                <span className="text-sm text-foreground font-medium">{formatARS(Number(c.total))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Detalle mensual {year}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-2.5 text-muted-foreground font-medium">Período</th>
                <th className="px-6 py-2.5 text-muted-foreground font-medium text-right">ARS</th>
                <th className="px-6 py-2.5 text-muted-foreground font-medium text-right">USD</th>
                <th className="px-6 py-2.5 text-muted-foreground font-medium text-right">Pagados</th>
                <th className="px-6 py-2.5 text-muted-foreground font-medium text-right">Pendientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {yearly.map((p) => (
                <tr key={p.periodId} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-3 text-foreground">{formatPeriodLabel(p.periodDate)}</td>
                  <td className="px-6 py-3 text-right text-foreground">{formatARS(p.totalArs)}</td>
                  <td className="px-6 py-3 text-right text-primary">{p.totalUsd > 0 ? formatUSD(p.totalUsd) : '-'}</td>
                  <td className="px-6 py-3 text-right text-green-400">{p.paidCount}</td>
                  <td className="px-6 py-3 text-right text-yellow-400">{p.pendingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
