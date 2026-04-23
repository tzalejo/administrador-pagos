import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ServiceTemplate } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const SELECT_CLS =
  'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

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
    <div className="flex flex-col gap-3 max-w-2xl h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-3rem)]">

      {/* ── TOP SECTION (fijo) ── */}
      <div className="shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Configuración</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Servicios predefinidos para nuevos períodos
            </p>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            + Agregar
          </Button>
        </div>

        {showForm && (
          <Card className="glow-border">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm">
                {editId ? 'Editar servicio' : 'Nuevo servicio'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-5 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Nombre *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: naranja, seguro..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Categoría</Label>
                  <select
                    value={categoryId ?? ''}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className={SELECT_CLS}
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={!name || saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── LISTA SCROLLABLE ── */}
      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <CardHeader className="shrink-0 border-b border-border pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Servicios
              <span className="text-muted-foreground font-normal ml-1.5">({templates.length})</span>
            </CardTitle>
            <CardDescription className="text-[11px] m-0">
              {templates.filter((t) => t.isActive).length} activos
            </CardDescription>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">Cargando...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No hay servicios configurados.</p>
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      t.isActive ? 'bg-primary glow-sm' : 'bg-muted-foreground/30',
                    )}
                  />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', t.isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {t.name}
                    </p>
                    {t.category && (
                      <p className="text-xs text-muted-foreground">{t.category.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  {!t.isActive && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground mr-1">
                      Inactivo
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={() => toggleMutation.mutate(t)}
                  >
                    {t.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={() => startEdit(t)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`¿Eliminar "${t.name}"?`)) deleteMutation.mutate(t.id);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
