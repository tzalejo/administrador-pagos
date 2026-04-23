import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ServiceTemplate } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Servicios predefinidos para nuevos períodos
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          + Agregar
        </Button>
      </div>

      {showForm && (
        <Card className="glow-border">
          <CardHeader>
            <CardTitle className="text-base">
              {editId ? 'Editar servicio' : 'Nuevo servicio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: naranja, seguro..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Categoría</Label>
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!name || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Cargando...</div>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Servicios ({templates.length})</CardTitle>
            <CardDescription>
              Los servicios activos se agregan automáticamente a cada período nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      t.isActive ? 'bg-primary glow-sm' : 'bg-muted-foreground/40',
                    )}
                  />
                  <div>
                    <p className={cn('text-sm font-medium', t.isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {t.name}
                    </p>
                    {t.category && (
                      <p className="text-xs text-muted-foreground">{t.category.label}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!t.isActive && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
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
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
