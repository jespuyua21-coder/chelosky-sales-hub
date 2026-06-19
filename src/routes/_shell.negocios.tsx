import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, GIROS, newId, DEFAULT_TICKET, type Giro } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Store, Plus, Trash2, Pencil, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/negocios")({
  component: Negocios,
});

const PALETTE = ["#0F4C81", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

function Negocios() {
  const { data, update, setNegocioActivo } = useStore();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    giro: "ventas_online" as Giro,
    telefono: "",
    direccion: "",
    color: PALETTE[0],
  });

  const reset = () => {
    setForm({ nombre: "", giro: "ventas_online", telefono: "", direccion: "", color: PALETTE[0] });
    setEditId(null);
  };

  const openNew = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const n = data.negocios.find((x) => x.id === id);
    if (!n) return;
    setForm({
      nombre: n.nombre,
      giro: n.giro,
      telefono: n.telefono || "",
      direccion: n.direccion || "",
      color: n.color,
    });
    setEditId(id);
    setOpen(true);
  };

  const submit = () => {
    if (!form.nombre.trim()) return toast.error("El nombre es obligatorio");
    if (editId) {
      update((d) => ({
        ...d,
        negocios: d.negocios.map((n) =>
          n.id === editId ? { ...n, ...form, nombre: form.nombre.trim() } : n,
        ),
      }));
      toast.success("Negocio actualizado");
    } else {
      const id = newId();
      update((d) => ({
        ...d,
        negocios: [
          ...d.negocios,
          {
            id,
            ...form,
            nombre: form.nombre.trim(),
            ticketConfig: { ...DEFAULT_TICKET, headerColor: form.color },
            createdAt: new Date().toISOString(),
          },
        ],
        negocioActivoId: d.negocioActivoId ?? id,
      }));
      toast.success("Negocio creado");
    }
    setOpen(false);
    reset();
  };

  const remove = (id: string) => {
    if (!confirm("¿Eliminar este negocio? También se borrarán sus ventas, productos y datos relacionados.")) return;
    update((d) => ({
      ...d,
      negocios: d.negocios.filter((n) => n.id !== id),
      productos: d.productos.filter((p) => p.negocioId !== id),
      ventas: d.ventas.filter((v) => v.negocioId !== id),
      clientes: d.clientes.filter((c) => c.negocioId !== id),
      pedidos: d.pedidos.filter((p) => p.negocioId !== id),
      vendedores: d.vendedores.filter((v) => v.negocioId !== id),
      gastos: d.gastos.filter((g) => g.negocioId !== id),
      prestamos: d.prestamos.filter((p) => p.negocioId !== id),
      negocioActivoId: d.negocioActivoId === id ? null : d.negocioActivoId,
    }));
    toast.success("Negocio eliminado");
  };

  return (
    <div>
      <PageHeader
        title="Mis Negocios"
        description="Agrega cada tienda o comercio que gestionas"
        actions={
          <Button onClick={openNew}>
            <Plus className="w-4 h-4" /> Nuevo negocio
          </Button>
        }
      />

      {data.negocios.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Sin negocios aún"
          description="Crea tu primer negocio: una tienda, comercio o servicio."
          action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Crear negocio</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.negocios.map((n) => {
            const g = GIROS.find((x) => x.value === n.giro);
            const active = data.negocioActivoId === n.id;
            return (
              <Card key={n.id} className="p-5 shadow-soft relative">
                {active && (
                  <div className="absolute top-3 right-3 text-xs flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                  </div>
                )}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: n.color + "22", color: n.color }}
                  >
                    {g?.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{n.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{g?.label}</p>
                  </div>
                </div>
                {(n.telefono || n.direccion) && (
                  <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                    {n.telefono && <div>📞 {n.telefono}</div>}
                    {n.direccion && <div>📍 {n.direccion}</div>}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  {!active && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setNegocioActivo(n.id)}>
                      Activar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(n.id)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(n.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar negocio" : "Nuevo negocio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del negocio</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Boutique Luna" />
            </div>
            <div>
              <Label>Giro</Label>
              <Select value={form.giro} onValueChange={(v) => setForm({ ...form, giro: v as Giro })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GIROS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.emoji} {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div>
                <Label>Color de marca</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Textarea rows={2} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit}>{editId ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
