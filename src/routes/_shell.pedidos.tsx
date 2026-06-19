import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, newId, type Pedido } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/pedidos")({
  component: Pedidos,
});

const ESTADOS: Pedido["estado"][] = ["pendiente", "en_proceso", "listo", "entregado", "cancelado"];
const ESTADO_COLOR: Record<Pedido["estado"], string> = {
  pendiente: "bg-warning/15 text-warning-foreground",
  en_proceso: "bg-blue-500/15 text-blue-700",
  listo: "bg-emerald-500/15 text-emerald-700",
  entregado: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/15 text-destructive",
};

function Pedidos() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const pedidos = negocioId ? data.pedidos.filter((p) => p.negocioId === negocioId).slice().reverse() : [];
  const negocio = data.negocios.find((n) => n.id === negocioId);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clienteNombre: "", telefono: "", descripcion: "", monto: 0, fechaEntrega: "" });

  const submit = () => {
    if (!negocioId) return;
    if (!form.clienteNombre.trim() || !form.descripcion.trim()) return toast.error("Cliente y descripción requeridos");
    update((d) => ({
      ...d,
      pedidos: [...d.pedidos, {
        id: newId(), negocioId,
        clienteNombre: form.clienteNombre.trim(),
        telefono: form.telefono || undefined,
        descripcion: form.descripcion.trim(),
        monto: form.monto || undefined,
        fechaEntrega: form.fechaEntrega || undefined,
        estado: "pendiente",
        fechaPedido: new Date().toISOString(),
      }],
    }));
    setOpen(false); setForm({ clienteNombre: "", telefono: "", descripcion: "", monto: 0, fechaEntrega: "" });
    toast.success("Pedido registrado");
  };

  const changeEstado = (id: string, estado: Pedido["estado"]) => {
    update((d) => ({ ...d, pedidos: d.pedidos.map((p) => p.id === id ? { ...p, estado } : p) }));
  };
  const remove = (id: string) => {
    if (!confirm("¿Eliminar pedido?")) return;
    update((d) => ({ ...d, pedidos: d.pedidos.filter((p) => p.id !== id) }));
  };
  const enviarWhats = (p: Pedido) => {
    if (!p.telefono) return toast.error("Sin teléfono");
    const texto = `Hola ${p.clienteNombre}, te escribo de ${negocio?.nombre} sobre tu pedido: ${p.descripcion}. Estado actual: ${p.estado.replace("_", " ")}.`;
    const tel = p.telefono.replace(/\D/g, "");
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  if (!negocioId) {
    return (<div><PageHeader title="Pedidos" /><EmptyState icon={ClipboardList} title="Selecciona un negocio" description="Activa un negocio." /></div>);
  }

  return (
    <div>
      <PageHeader title="Pedidos / Encargos" description="Seguimiento de pedidos y encargos de clientes" actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nuevo pedido</Button>} />
      {pedidos.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin pedidos" description="Registra encargos para no perder ventas futuras." action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Crear pedido</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pedidos.map((p) => (
            <Card key={p.id} className="p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{p.clienteNombre}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(p.fechaPedido).toLocaleDateString("es-MX")}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${ESTADO_COLOR[p.estado]}`}>
                  {p.estado.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm mb-3">{p.descripcion}</p>
              {p.monto ? <div className="text-sm font-semibold mb-2">${p.monto}</div> : null}
              {p.fechaEntrega && <div className="text-xs text-muted-foreground mb-2">Entrega: {p.fechaEntrega}</div>}
              <div className="flex gap-2">
                <Select value={p.estado} onValueChange={(v) => changeEstado(p.id, v as Pedido["estado"])}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                {p.telefono && <Button size="sm" variant="ghost" onClick={() => enviarWhats(p)}><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /></Button>}
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo pedido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cliente</Label><Input value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            <div><Label>Descripción del pedido</Label><Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Monto (opc.)</Label><Input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: +e.target.value })} /></div>
              <div><Label>Fecha entrega</Label><Input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
