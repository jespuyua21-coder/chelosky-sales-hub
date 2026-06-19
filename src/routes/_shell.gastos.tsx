import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, newId, type Gasto } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Plus, Trash2, Fuel, UtensilsCrossed, Briefcase, Home, Zap, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/gastos")({
  component: Gastos,
});

const CATS: { value: Gasto["categoria"]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "gasolina", label: "Gasolina", icon: Fuel },
  { value: "comidas", label: "Comidas", icon: UtensilsCrossed },
  { value: "negocio", label: "Negocio", icon: Briefcase },
  { value: "renta", label: "Renta", icon: Home },
  { value: "servicios", label: "Servicios", icon: Zap },
  { value: "otro", label: "Otro", icon: MoreHorizontal },
];

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Gastos() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const gastos = negocioId ? data.gastos.filter((g) => g.negocioId === negocioId).slice().reverse() : [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ categoria: Gasto["categoria"]; monto: number; descripcion: string; fecha: string }>({
    categoria: "negocio", monto: 0, descripcion: "", fecha: new Date().toISOString().slice(0, 10),
  });

  const submit = () => {
    if (!negocioId) return;
    if (form.monto <= 0) return toast.error("Monto requerido");
    update((d) => ({ ...d, gastos: [...d.gastos, { id: newId(), negocioId, ...form, descripcion: form.descripcion.trim(), fecha: new Date(form.fecha).toISOString() }] }));
    setOpen(false); setForm({ categoria: "negocio", monto: 0, descripcion: "", fecha: new Date().toISOString().slice(0, 10) });
    toast.success("Gasto registrado");
  };
  const remove = (id: string) => {
    if (!confirm("¿Eliminar gasto?")) return;
    update((d) => ({ ...d, gastos: d.gastos.filter((g) => g.id !== id) }));
  };

  const totalMes = gastos
    .filter((g) => g.fecha.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((s, g) => s + g.monto, 0);
  const porCategoria = CATS.map((c) => ({
    ...c,
    total: gastos.filter((g) => g.categoria === c.value).reduce((s, g) => s + g.monto, 0),
  }));

  if (!negocioId) return (<div><PageHeader title="Gastos" /><EmptyState icon={Wallet} title="Selecciona un negocio" description="Activa un negocio." /></div>);

  return (
    <div>
      <PageHeader title="Gastos" description="Lleva el control de cada peso que sale" actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nuevo gasto</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 col-span-2 lg:col-span-1"><div className="text-xs text-muted-foreground">Este mes</div><div className="text-2xl font-bold text-destructive">{fmt(totalMes)}</div></Card>
        {porCategoria.slice(0, 3).map((c) => (
          <Card key={c.value} className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><c.icon className="w-3.5 h-3.5" /> {c.label}</div>
            <div className="text-lg font-semibold">{fmt(c.total)}</div>
          </Card>
        ))}
      </div>

      {gastos.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin gastos registrados" description="Registra gasolina, comidas, renta, etc." action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Agregar</Button>} />
      ) : (
        <Card className="shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr><th className="p-3">Fecha</th><th className="p-3">Categoría</th><th className="p-3">Descripción</th><th className="p-3 text-right">Monto</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {gastos.map((g) => {
                const cat = CATS.find((c) => c.value === g.categoria);
                return (
                  <tr key={g.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(g.fecha).toLocaleDateString("es-MX")}</td>
                    <td className="p-3"><span className="inline-flex items-center gap-1.5">{cat && <cat.icon className="w-3.5 h-3.5" />} {cat?.label}</span></td>
                    <td className="p-3">{g.descripcion || "—"}</td>
                    <td className="p-3 text-right font-medium text-destructive">{fmt(g.monto)}</td>
                    <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo gasto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Categoría</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as Gasto["categoria"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Monto</Label><Input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: +e.target.value })} /></div>
              <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
            </div>
            <div><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={submit}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
