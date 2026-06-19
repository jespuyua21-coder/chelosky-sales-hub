import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useStore, newId, type VentaItem, type Venta } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Plus, Trash2, MessageCircle, Image as ImageIcon, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { TicketPreview, ticketToText } from "@/components/TicketPreview";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/_shell/ventas")({
  component: Ventas,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Ventas() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const negocio = data.negocios.find((n) => n.id === negocioId) || null;
  const ventas = negocioId ? data.ventas.filter((v) => v.negocioId === negocioId).slice().reverse() : [];
  const productos = negocioId ? data.productos.filter((p) => p.negocioId === negocioId) : [];
  const clientes = negocioId ? data.clientes.filter((c) => c.negocioId === negocioId) : [];

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<VentaItem[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [metodoPago, setMetodoPago] = useState<Venta["metodoPago"]>("efectivo");
  const [pagada, setPagada] = useState(true);
  const [notas, setNotas] = useState("");
  const [productoSel, setProductoSel] = useState("");
  const [cantidad, setCantidad] = useState(1);

  // ticket dialog
  const [ticketVenta, setTicketVenta] = useState<Venta | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setItems([]); setClienteNombre(""); setMetodoPago("efectivo"); setPagada(true);
    setNotas(""); setProductoSel(""); setCantidad(1);
  };

  const addItem = () => {
    if (!productoSel) return;
    const p = productos.find((x) => x.id === productoSel);
    if (!p) return;
    setItems((arr) => {
      const exists = arr.find((i) => i.productoId === p.id);
      if (exists) return arr.map((i) => i.productoId === p.id ? { ...i, cantidad: i.cantidad + cantidad } : i);
      return [...arr, { productoId: p.id, nombre: p.nombre, precio: p.precio, costo: p.costo, cantidad }];
    });
    setProductoSel(""); setCantidad(1);
  };

  const addCustom = () => {
    setItems((arr) => [...arr, { productoId: "custom", nombre: "Producto manual", precio: 0, costo: 0, cantidad: 1 }]);
  };

  const updateItem = (idx: number, patch: Partial<VentaItem>) => {
    setItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const ganancia = items.reduce((s, i) => s + (i.precio - i.costo) * i.cantidad, 0);

  const guardar = () => {
    if (!negocioId) return;
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    const venta: Venta = {
      id: newId(), negocioId, items, total, ganancia,
      metodoPago, pagada, clienteNombre: clienteNombre.trim() || undefined,
      fecha: new Date().toISOString(), notas: notas.trim() || undefined,
    };
    update((d) => {
      const newProductos = d.productos.map((p) => {
        const it = items.find((i) => i.productoId === p.id);
        return it ? { ...p, stock: Math.max(0, p.stock - it.cantidad) } : p;
      });
      return { ...d, ventas: [...d.ventas, venta], productos: newProductos };
    });
    toast.success("Venta registrada");
    setOpen(false);
    resetForm();
    setTicketVenta(venta);
  };

  const shareText = (v: Venta) => {
    if (!negocio) return;
    const text = ticketToText(negocio, v);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareImage = async () => {
    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ticket-${ticketVenta?.id.slice(0,6)}.png`;
      a.click();
      toast.success("Ticket descargado · compártelo en WhatsApp");
    } catch {
      toast.error("No se pudo generar la imagen");
    }
  };

  if (!negocioId || !negocio) {
    return (
      <div>
        <PageHeader title="Ventas" />
        <EmptyState icon={ShoppingCart} title="Selecciona un negocio" description="Activa un negocio para registrar ventas." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        description={`Negocio: ${negocio.nombre}`}
        actions={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nueva venta</Button>}
      />

      {ventas.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Sin ventas registradas" description="Empieza registrando tu primera venta." action={<Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nueva venta</Button>} />
      ) : (
        <Card className="shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3 text-right">Ítems</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Ganancia</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(v.fecha).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="p-3">{v.clienteNombre || "—"}</td>
                    <td className="p-3 text-right">{v.items.length}</td>
                    <td className="p-3 text-right font-medium">{fmt(v.total)}</td>
                    <td className="p-3 text-right text-emerald-600">+{fmt(v.ganancia)}</td>
                    <td className="p-3 text-xs">
                      <span className="capitalize">{v.metodoPago}</span>
                      {!v.pagada && <span className="ml-1 px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[10px]">Pendiente</span>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => setTicketVenta(v)} title="Ver ticket"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => shareText(v)} title="Compartir texto"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Nueva venta */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva venta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente (opcional)</Label>
              <Input list="clientes-list" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Cliente mostrador" />
              <datalist id="clientes-list">
                {clientes.map((c) => <option key={c.id} value={c.nombre} />)}
              </datalist>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-3">
              <div className="font-medium text-sm">Agregar productos</div>
              {productos.length > 0 ? (
                <div className="flex gap-2">
                  <Select value={productoSel} onValueChange={setProductoSel}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre} — {fmt(p.precio)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(+e.target.value || 1)} className="w-20" />
                  <Button type="button" onClick={addItem}>Añadir</Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No hay productos. Puedes capturar manualmente.</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addCustom} className="w-full">
                <Plus className="w-3.5 h-3.5" /> Agregar producto manual
              </Button>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-muted/40 p-2 rounded">
                      <Input value={it.nombre} onChange={(e) => updateItem(idx, { nombre: e.target.value })} className="flex-1 h-8" />
                      <Input type="number" value={it.cantidad} onChange={(e) => updateItem(idx, { cantidad: +e.target.value || 1 })} className="w-16 h-8" />
                      <Input type="number" step="0.01" value={it.precio} onChange={(e) => updateItem(idx, { precio: +e.target.value })} className="w-24 h-8" />
                      <Button size="sm" variant="ghost" onClick={() => setItems((a) => a.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Método de pago</Label>
                <Select value={metodoPago} onValueChange={(v) => setMetodoPago(v as Venta["metodoPago"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="credito">Crédito (deudor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <div className="flex items-center gap-2">
                  <Switch checked={pagada} onCheckedChange={setPagada} id="pagada" />
                  <Label htmlFor="pagada">Pagada</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>

            <div className="flex justify-between items-center bg-primary-soft rounded-lg p-3">
              <div>
                <div className="text-xs text-muted-foreground">Ganancia: <span className="text-emerald-600 font-semibold">{fmt(ganancia)}</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">TOTAL</div>
                <div className="text-2xl font-bold text-primary">{fmt(total)}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={guardar}>Registrar venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket */}
      <Dialog open={!!ticketVenta} onOpenChange={(v) => !v && setTicketVenta(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ticket de venta</DialogTitle></DialogHeader>
          {ticketVenta && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <TicketPreview ref={ticketRef} negocio={negocio} venta={ticketVenta} />
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => ticketVenta && shareText(ticketVenta)} className="flex-1">
              <FileText className="w-4 h-4" /> WhatsApp (texto)
            </Button>
            <Button onClick={shareImage} className="flex-1">
              <ImageIcon className="w-4 h-4" /> Descargar imagen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
