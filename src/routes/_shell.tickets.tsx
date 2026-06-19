import { createFileRoute } from "@tanstack/react-router";
import { useStore, type TicketConfig, type Venta } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketPreview } from "@/components/TicketPreview";
import { Palette } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/tickets")({
  component: TicketsEditor,
});

const FUENTES = [
  "Plus Jakarta Sans", "Inter", "Arial", "Helvetica", "Georgia", "Times New Roman",
  "Courier New", "Verdana", "Tahoma", "Trebuchet MS", "Palatino", "Garamond",
  "Comic Sans MS", "Impact", "Lucida Console", "Lucida Sans", "Brush Script MT",
  "Calibri", "Cambria", "Consolas",
];

const COLORES = ["#0F4C81", "#3B82F6", "#1F2937", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#000000"];

function TicketsEditor() {
  const { data, update } = useStore();
  const negocioId = data.negocioActivoId;
  const negocio = data.negocios.find((n) => n.id === negocioId);

  if (!negocioId || !negocio) {
    return (<div><PageHeader title="Editor de Tickets" /><EmptyState icon={Palette} title="Selecciona un negocio" description="Activa un negocio para personalizar su ticket." /></div>);
  }

  const cfg = negocio.ticketConfig;
  const setCfg = (patch: Partial<TicketConfig>) => {
    update((d) => ({
      ...d,
      negocios: d.negocios.map((n) => n.id === negocioId ? { ...n, ticketConfig: { ...n.ticketConfig, ...patch } } : n),
    }));
  };

  const ventaDemo: Venta = {
    id: "demo01", negocioId, items: [
      { productoId: "p1", nombre: "Producto demo 1", precio: 150, costo: 80, cantidad: 2 },
      { productoId: "p2", nombre: "Producto demo 2", precio: 90, costo: 50, cantidad: 1 },
    ],
    total: 390, ganancia: 220, metodoPago: "efectivo", pagada: true,
    clienteNombre: "Cliente Ejemplo", fecha: new Date().toISOString(),
  };

  return (
    <div>
      <PageHeader title="Editor de Tickets" description={`Personaliza el ticket de ${negocio.nombre}`} actions={<Button variant="outline" onClick={() => toast.success("Cambios guardados")}>Guardado automático</Button>} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 shadow-soft space-y-4">
          <h3 className="font-semibold">Diseño</h3>

          <div>
            <Label>Tipografía (20 opciones)</Label>
            <Select value={cfg.font} onValueChange={(v) => setCfg({ font: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUENTES.map((f) => <SelectItem key={f} value={f}><span style={{ fontFamily: f }}>{f}</span></SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Color principal (encabezado)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COLORES.map((c) => (
                <button key={c} onClick={() => setCfg({ headerColor: c })} className={`w-8 h-8 rounded-full border-2 ${cfg.headerColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={cfg.headerColor} onChange={(e) => setCfg({ headerColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Color de texto</Label>
              <input type="color" value={cfg.textColor} onChange={(e) => setCfg({ textColor: e.target.value })} className="w-full h-10 rounded cursor-pointer mt-1" />
            </div>
            <div>
              <Label>Color de fondo</Label>
              <input type="color" value={cfg.bgColor} onChange={(e) => setCfg({ bgColor: e.target.value })} className="w-full h-10 rounded cursor-pointer mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={cfg.showLogo} onCheckedChange={(v) => setCfg({ showLogo: v })} id="showlogo" />
            <Label htmlFor="showlogo">Mostrar emoji del giro como logo</Label>
          </div>

          <div>
            <Label>Mensaje de pie</Label>
            <Textarea rows={2} value={cfg.footer} onChange={(e) => setCfg({ footer: e.target.value })} placeholder="¡Gracias por tu compra!" />
          </div>

          <div>
            <Label>Nombre del negocio (afecta también al ticket)</Label>
            <Input value={negocio.nombre} onChange={(e) => update((d) => ({ ...d, negocios: d.negocios.map((n) => n.id === negocioId ? { ...n, nombre: e.target.value } : n) }))} />
          </div>
        </Card>

        <div className="lg:sticky lg:top-20 h-fit">
          <Card className="p-5 shadow-soft bg-muted/30">
            <h3 className="font-semibold mb-4">Vista previa</h3>
            <TicketPreview negocio={negocio} venta={ventaDemo} />
          </Card>
        </div>
      </div>
    </div>
  );
}
