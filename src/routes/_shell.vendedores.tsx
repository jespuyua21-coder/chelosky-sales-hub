import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, newId } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UsersRound, Plus, Trash2, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/vendedores")({
  component: Vendedores,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Vendedores() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const vendedores = negocioId ? data.vendedores.filter((v) => v.negocioId === negocioId) : [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", sueldoBase: 0, comisionPct: 0 });
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [adelantoOpen, setAdelantoOpen] = useState<string | null>(null);
  const [adelantoMonto, setAdelantoMonto] = useState(0);
  const [adelantoDesc, setAdelantoDesc] = useState("");

  const submit = () => {
    if (!negocioId) return;
    if (!form.nombre.trim()) return toast.error("Nombre requerido");
    update((d) => ({ ...d, vendedores: [...d.vendedores, { id: newId(), negocioId, ...form, nombre: form.nombre.trim(), activo: true }] }));
    setOpen(false); setForm({ nombre: "", telefono: "", sueldoBase: 0, comisionPct: 0 });
    toast.success("Vendedor agregado");
  };
  const remove = (id: string) => {
    if (!confirm("¿Eliminar vendedor?")) return;
    update((d) => ({ ...d, vendedores: d.vendedores.filter((v) => v.id !== id) }));
  };

  const toggleAsistencia = (vendedorId: string, presente: boolean) => {
    const existing = data.asistencias.find((a) => a.vendedorId === vendedorId && a.fecha === fecha);
    if (existing) {
      update((d) => ({ ...d, asistencias: d.asistencias.map((a) => a.id === existing.id ? { ...a, presente } : a) }));
    } else {
      update((d) => ({ ...d, asistencias: [...d.asistencias, { id: newId(), vendedorId, fecha, presente }] }));
    }
  };
  const getAsist = (vendedorId: string) => data.asistencias.find((a) => a.vendedorId === vendedorId && a.fecha === fecha);

  const saveAdelanto = () => {
    if (!adelantoOpen || adelantoMonto <= 0) return;
    update((d) => ({ ...d, adelantos: [...d.adelantos, { id: newId(), vendedorId: adelantoOpen, monto: adelantoMonto, fecha: new Date().toISOString(), descripcion: adelantoDesc }] }));
    setAdelantoOpen(null); setAdelantoMonto(0); setAdelantoDesc("");
    toast.success("Adelanto registrado");
  };

  const adelantosTotales = (vid: string) => data.adelantos.filter((a) => a.vendedorId === vid).reduce((s, a) => s + a.monto, 0);

  if (!negocioId) return (<div><PageHeader title="Vendedores" /><EmptyState icon={UsersRound} title="Selecciona un negocio" description="Activa un negocio." /></div>);

  return (
    <div>
      <PageHeader title="Vendedores" description="Registro, asistencias y adelantos" actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nuevo vendedor</Button>} />

      <div className="mb-4 flex items-center gap-3">
        <Label className="text-sm">Día de asistencia:</Label>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-auto" />
      </div>

      {vendedores.length === 0 ? (
        <EmptyState icon={UsersRound} title="Sin vendedores" description="Agrega tu equipo de ventas." action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Agregar</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {vendedores.map((v) => {
            const a = getAsist(v.id);
            const adel = adelantosTotales(v.id);
            return (
              <Card key={v.id} className="p-4 shadow-soft">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{v.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{v.telefono || "—"}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div><span className="text-muted-foreground">Sueldo base:</span> <strong>{fmt(v.sueldoBase)}</strong></div>
                  <div><span className="text-muted-foreground">Comisión:</span> <strong>{v.comisionPct}%</strong></div>
                  <div><span className="text-muted-foreground">Adelantos:</span> <strong className="text-warning-foreground">{fmt(adel)}</strong></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant={a?.presente ? "default" : "outline"} onClick={() => toggleAsistencia(v.id, true)} className="flex-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                  </Button>
                  <Button size="sm" variant={a && !a.presente ? "destructive" : "outline"} onClick={() => toggleAsistencia(v.id, false)} className="flex-1">
                    <XCircle className="w-3.5 h-3.5" /> Falta
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAdelantoOpen(v.id)}>
                    <DollarSign className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo vendedor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Sueldo base</Label><Input type="number" step="0.01" value={form.sueldoBase} onChange={(e) => setForm({ ...form, sueldoBase: +e.target.value })} /></div>
              <div><Label>Comisión %</Label><Input type="number" step="0.1" value={form.comisionPct} onChange={(e) => setForm({ ...form, comisionPct: +e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Crear</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adelantoOpen} onOpenChange={(v) => !v && setAdelantoOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar adelanto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Monto</Label><Input type="number" step="0.01" value={adelantoMonto} onChange={(e) => setAdelantoMonto(+e.target.value)} /></div>
            <div><Label>Descripción</Label><Input value={adelantoDesc} onChange={(e) => setAdelantoDesc(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdelantoOpen(null)}>Cancelar</Button><Button onClick={saveAdelanto}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
