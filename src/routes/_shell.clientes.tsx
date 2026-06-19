import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, newId } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Star, Phone, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/clientes")({
  component: Clientes,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Clientes() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const clientes = negocioId ? data.clientes.filter((c) => c.negocioId === negocioId) : [];
  const ventas = negocioId ? data.ventas.filter((v) => v.negocioId === negocioId) : [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", notas: "", favorito: false });

  const submit = () => {
    if (!negocioId) return;
    if (!form.nombre.trim()) return toast.error("Nombre requerido");
    update((d) => ({ ...d, clientes: [...d.clientes, { id: newId(), negocioId, ...form, nombre: form.nombre.trim() }] }));
    setOpen(false); setForm({ nombre: "", telefono: "", notas: "", favorito: false });
    toast.success("Cliente agregado");
  };
  const remove = (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    update((d) => ({ ...d, clientes: d.clientes.filter((c) => c.id !== id) }));
  };
  const toggleFav = (id: string) => {
    update((d) => ({ ...d, clientes: d.clientes.map((c) => c.id === id ? { ...c, favorito: !c.favorito } : c) }));
  };

  // ranking
  const totalPorCliente = (nombre: string) => {
    return ventas.filter((v) => v.clienteNombre === nombre).reduce((s, v) => s + v.total, 0);
  };
  const deudaPorCliente = (nombre: string) => {
    return ventas.filter((v) => v.clienteNombre === nombre && !v.pagada).reduce((s, v) => s + v.total, 0);
  };

  if (!negocioId) {
    return (<div><PageHeader title="Clientes" /><EmptyState icon={Users} title="Selecciona un negocio" description="Activa un negocio para gestionar clientes." /></div>);
  }

  return (
    <div>
      <PageHeader title="Clientes" description="Clientes frecuentes, favoritos y deudores" actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nuevo cliente</Button>} />
      {clientes.length === 0 ? (
        <EmptyState icon={Users} title="Sin clientes" description="Agrega clientes para llevar su historial." action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Agregar</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clientes.map((c) => {
            const total = totalPorCliente(c.nombre);
            const deuda = deudaPorCliente(c.nombre);
            return (
              <Card key={c.id} className="p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{c.nombre}</h3>
                      {c.favorito && <Star className="w-3.5 h-3.5 fill-warning text-warning" />}
                    </div>
                    {c.telefono && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {c.telefono}</div>}
                    {c.notas && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.notas}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleFav(c.id)}><Star className={`w-3.5 h-3.5 ${c.favorito ? "fill-warning text-warning" : ""}`} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Comprado</div>
                    <div className="font-semibold">{fmt(total)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Adeuda</div>
                    <div className={`font-semibold ${deuda > 0 ? "text-destructive flex items-center gap-1" : ""}`}>
                      {deuda > 0 && <AlertCircle className="w-3 h-3" />}{fmt(deuda)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.favorito} onChange={(e) => setForm({ ...form, favorito: e.target.checked })} />
              Marcar como favorito
            </label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
