import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ServiceTemplate } from '@/lib/api';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: api.templates.list,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editId != null
        ? api.templates.update(editId, { name, categoryId: categoryId ?? null })
        : api.templates.create({ name, categoryId: categoryId ?? null, isRecurring: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      resetForm();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (t: ServiceTemplate) => api.templates.update(t.id, { isActive: !t.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.templates.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  function startEdit(t: ServiceTemplate) {
    setEditId(t.id);
    setName(t.name);
    setCategoryId(t.category?.id ?? null);
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setName('');
    setCategoryId(null);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-slate-400 text-sm mt-1">Servicios predefinidos para nuevos períodos</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h2 className="font-semibold text-white mb-4">
            {editId ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Nombre *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="ej: naranja, seguro..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-300">Categoría</label>
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!name || saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-700">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn('w-2 h-2 rounded-full', t.isActive ? 'bg-green-400' : 'bg-slate-600')}
                  />
                  <div>
                    <p className={cn('text-sm font-medium', t.isActive ? 'text-white' : 'text-slate-500')}>
                      {t.name}
                    </p>
                    {t.category && (
                      <p className="text-xs text-slate-400">{t.category.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMutation.mutate(t)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    {t.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => startEdit(t)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${t.name}"?`)) deleteMutation.mutate(t.id);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/40 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
