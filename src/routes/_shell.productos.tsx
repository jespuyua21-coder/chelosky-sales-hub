import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, newId } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Package, Plus, Trash2, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/productos")({
  component: Productos,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Productos() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const productos = negocioId ? data.productos.filter((p) => p.negocioId === negocioId) : [];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", precio: 0, costo: 0, stock: 0, categoria: "" });

  const openNew = () => {
    setForm({ nombre: "", precio: 0, costo: 0, stock: 0, categoria: "" });
    setEditId(null);
    setOpen(true);
  };
  const openEdit = (id: string) => {
    const p = productos.find((x) => x.id === id);
    if (!p) return;
    setForm({ nombre: p.nombre, precio: p.precio, costo: p.costo, stock: p.stock, categoria: p.categoria || "" });
    setEditId(id);
    setOpen(true);
  };
  const submit = () => {
    if (!negocioId) return toast.error("Selecciona un negocio activo");
    if (!form.nombre.trim()) return toast.error("Nombre requerido");
    if (editId) {
      update((d) => ({
        ...d,
        productos: d.productos.map((p) => p.id === editId ? { ...p, ...form, nombre: form.nombre.trim() } : p),
      }));
      toast.success("Producto actualizado");
    } else {
      update((d) => ({
        ...d,
        productos: [...d.productos, { id: newId(), negocioId, ...form, nombre: form.nombre.trim() }],
      }));
      toast.success("Producto agregado");
    }
    setOpen(false);
  };
  const remove = (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    update((d) => ({ ...d, productos: d.productos.filter((p) => p.id !== id) }));
  };

  if (!negocioId) {
    return (
      <div>
        <PageHeader title="Productos / Stock" />
        <EmptyState icon={Package} title="Selecciona un negocio" description="Activa un negocio desde la barra superior para gestionar productos." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Productos / Stock"
        description="Catálogo del negocio activo"
        actions={<Button onClick={openNew}><Plus className="w-4 h-4" /> Nuevo producto</Button>}
      />

      {productos.length === 0 ? (
        <EmptyState icon={Package} title="Sin productos" description="Agrega productos para registrarlos en las ventas." action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Agregar</Button>} />
      ) : (
        <Card className="shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 font-medium">Producto</th>
                  <th className="p-3 font-medium">Categoría</th>
                  <th className="p-3 font-medium text-right">Costo</th>
                  <th className="p-3 font-medium text-right">Precio</th>
                  <th className="p-3 font-medium text-right">Margen</th>
                  <th className="p-3 font-medium text-right">Stock</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const margen = p.precio - p.costo;
                  const lowStock = p.stock <= 5;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.nombre}</td>
                      <td className="p-3 text-muted-foreground">{p.categoria || "—"}</td>
                      <td className="p-3 text-right text-muted-foreground">{fmt(p.costo)}</td>
                      <td className="p-3 text-right font-medium">{fmt(p.precio)}</td>
                      <td className="p-3 text-right text-emerald-600">{fmt(margen)}</td>
                      <td className="p-3 text-right">
                        <span className={`inline-flex items-center gap-1 ${lowStock ? "text-destructive" : ""}`}>
                          {lowStock && <AlertCircle className="w-3.5 h-3.5" />}
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Categoría</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Opcional" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Costo</Label><Input type="number" min="0" step="0.01" value={form.costo} onChange={(e) => setForm({ ...form, costo: +e.target.value })} /></div>
              <div><Label>Precio</Label><Input type="number" min="0" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: +e.target.value })} /></div>
              <div><Label>Stock</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
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
