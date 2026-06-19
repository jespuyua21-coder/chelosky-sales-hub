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
import { HandCoins, Plus, Trash2, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/prestamos")({
  component: Prestamos,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Prestamos() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const prestamos = negocioId ? data.prestamos.filter((p) => p.negocioId === negocioId).slice().reverse() : [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ clienteNombre: "", telefono: "", monto: 0, interesPct: 0, fechaPago: "", notas: "" });

  const submit = () => {
    if (!negocioId) return;
    if (!form.clienteNombre.trim() || form.monto <= 0 || !form.fechaPago) return toast.error("Completa cliente, monto y fecha de pago");
    update((d) => ({ ...d, prestamos: [...d.prestamos, { id: newId(), negocioId, ...form, clienteNombre: form.clienteNombre.trim(), fechaPrestamo: new Date().toISOString(), pagado: false }] }));
    setOpen(false); setForm({ clienteNombre: "", telefono: "", monto: 0, interesPct: 0, fechaPago: "", notas: "" });
    toast.success("Préstamo registrado");
  };
  const remove = (id: string) => {
    if (!confirm("¿Eliminar préstamo?")) return;
    update((d) => ({ ...d, prestamos: d.prestamos.filter((p) => p.id !== id) }));
  };
  const togglePagado = (id: string) => {
    update((d) => ({ ...d, prestamos: d.prestamos.map((p) => p.id === id ? { ...p, pagado: !p.pagado } : p) }));
  };

  const pendientes = prestamos.filter((p) => !p.pagado).reduce((s, p) => s + p.monto * (1 + p.interesPct / 100), 0);

  if (!negocioId) return (<div><PageHeader title="Préstamos" /><EmptyState icon={HandCoins} title="Selecciona un negocio" description="Activa un negocio." /></div>);

  return (
    <div>
      <PageHeader title="Préstamos" description="Préstamos otorgados y fechas de pago" actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nuevo préstamo</Button>} />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Por cobrar</div><div className="text-2xl font-bold text-warning-foreground">{fmt(pendientes)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Préstamos activos</div><div className="text-2xl font-bold">{prestamos.filter((p) => !p.pagado).length}</div></Card>
      </div>

      {prestamos.length === 0 ? (
        <EmptyState icon={HandCoins} title="Sin préstamos" description="Registra préstamos para no olvidar fechas de pago." action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Agregar</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {prestamos.map((p) => {
            const total = p.monto * (1 + p.interesPct / 100);
            const vencido = !p.pagado && new Date(p.fechaPago) < new Date();
            return (
              <Card key={p.id} className={`p-4 shadow-soft ${vencido ? "border-destructive/40" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{p.clienteNombre}</h3>
                    <p className="text-xs text-muted-foreground">Prestado: {new Date(p.fechaPrestamo).toLocaleDateString("es-MX")}</p>
                  </div>
                  {p.pagado ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success">Pagado</span>
                  ) : vencido ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Vencido</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground">Pendiente</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><div className="text-muted-foreground">Capital</div><div className="font-semibold">{fmt(p.monto)}</div></div>
                  <div><div className="text-muted-foreground">Interés</div><div className="font-semibold">{p.interesPct}%</div></div>
                  <div><div className="text-muted-foreground">Total</div><div className="font-semibold text-primary">{fmt(total)}</div></div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Pago: <strong>{new Date(p.fechaPago).toLocaleDateString("es-MX")}</strong></div>
                {p.notas && <p className="text-xs mt-2 text-muted-foreground">{p.notas}</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant={p.pagado ? "outline" : "default"} className="flex-1" onClick={() => togglePagado(p.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {p.pagado ? "Marcar pendiente" : "Marcar pagado"}
                  </Button>
                  {p.telefono && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const t = p.telefono!.replace(/\D/g, "");
                      const msg = `Hola ${p.clienteNombre}, te recuerdo el pago de ${fmt(total)} con fecha ${new Date(p.fechaPago).toLocaleDateString("es-MX")}.`;
                      window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /></Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo préstamo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cliente</Label><Input value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Monto</Label><Input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: +e.target.value })} /></div>
              <div><Label>Interés %</Label><Input type="number" step="0.1" value={form.interesPct} onChange={(e) => setForm({ ...form, interesPct: +e.target.value })} /></div>
            </div>
            <div><Label>Fecha de pago</Label><Input type="date" value={form.fechaPago} onChange={(e) => setForm({ ...form, fechaPago: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
