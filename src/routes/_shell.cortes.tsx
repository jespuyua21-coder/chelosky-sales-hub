import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Download } from "lucide-react";

export const Route = createFileRoute("/_shell/cortes")({
  component: Cortes,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - day + 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Cortes() {
  const { data } = useStore();
  const negocioId = data.negocioActivoId;
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  if (!negocioId) {
    return (<div><PageHeader title="Cortes de caja" /><EmptyState icon={Receipt} title="Selecciona un negocio" description="Activa un negocio." /></div>);
  }

  const ventas = data.ventas.filter((v) => v.negocioId === negocioId);
  const gastos = data.gastos.filter((g) => g.negocioId === negocioId);
  const vendedores = data.vendedores.filter((v) => v.negocioId === negocioId);

  // Diario
  const ventasDia = ventas.filter((v) => v.fecha.slice(0, 10) === fecha);
  const gastosDia = gastos.filter((g) => g.fecha.slice(0, 10) === fecha);
  const totalDia = ventasDia.reduce((s, v) => s + v.total, 0);
  const gananciaDia = ventasDia.reduce((s, v) => s + v.ganancia, 0);
  const gastoDia = gastosDia.reduce((s, g) => s + g.monto, 0);
  const mercanciaDia = ventasDia.reduce((s, v) => s + v.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const efectivoDia = ventasDia.filter((v) => v.metodoPago === "efectivo").reduce((s, v) => s + v.total, 0);

  // Semanal
  const inicioSem = startOfWeek(new Date(fecha));
  const finSem = new Date(inicioSem); finSem.setDate(finSem.getDate() + 7);
  const ventasSem = ventas.filter((v) => { const d = new Date(v.fecha); return d >= inicioSem && d < finSem; });
  const gastosSem = gastos.filter((g) => { const d = new Date(g.fecha); return d >= inicioSem && d < finSem; });
  const totalSem = ventasSem.reduce((s, v) => s + v.total, 0);
  const gananciaSem = ventasSem.reduce((s, v) => s + v.ganancia, 0);
  const gastoSem = gastosSem.reduce((s, g) => s + g.monto, 0);
  const porVendedor = vendedores.map((v) => {
    const sus = ventasSem.filter((x) => x.vendedorId === v.id);
    const totalV = sus.reduce((s, x) => s + x.total, 0);
    const comision = totalV * (v.comisionPct / 100);
    return { vendedor: v, ventas: sus.length, total: totalV, comision };
  });

  const exportCSV = () => {
    const rows = [["Fecha", "Cliente", "Items", "Total", "Ganancia", "Pago"]];
    ventasDia.forEach((v) => rows.push([v.fecha, v.clienteNombre || "", String(v.items.length), String(v.total), String(v.ganancia), v.metodoPago]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `corte-${fecha}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader title="Cortes de caja" description="Diarios y semanales" actions={<Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4" /> Exportar CSV</Button>} />

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Fecha:</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="border border-input rounded-md px-3 py-1.5 text-sm bg-background" />
      </div>

      <Tabs defaultValue="diario">
        <TabsList><TabsTrigger value="diario">Diario</TabsTrigger><TabsTrigger value="semanal">Semanal</TabsTrigger></TabsList>

        <TabsContent value="diario" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Total ventas</div><div className="text-2xl font-bold">{fmt(totalDia)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Ganancia</div><div className="text-2xl font-bold text-emerald-600">{fmt(gananciaDia)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Gastos</div><div className="text-2xl font-bold text-destructive">{fmt(gastoDia)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Utilidad neta</div><div className="text-2xl font-bold text-primary">{fmt(gananciaDia - gastoDia)}</div></Card>
          </div>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Detalle del día</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Tickets:</span> <strong>{ventasDia.length}</strong></div>
              <div><span className="text-muted-foreground">Mercancía vendida:</span> <strong>{mercanciaDia}</strong></div>
              <div><span className="text-muted-foreground">Efectivo:</span> <strong>{fmt(efectivoDia)}</strong></div>
              <div><span className="text-muted-foreground">Otros pagos:</span> <strong>{fmt(totalDia - efectivoDia)}</strong></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="semanal" className="space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">
            Semana del {inicioSem.toLocaleDateString("es-MX")} al {new Date(finSem.getTime() - 1).toLocaleDateString("es-MX")}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4"><div className="text-xs text-muted-foreground">Total ventas</div><div className="text-2xl font-bold">{fmt(totalSem)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Ganancia</div><div className="text-2xl font-bold text-emerald-600">{fmt(gananciaSem)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Gastos</div><div className="text-2xl font-bold text-destructive">{fmt(gastoSem)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted-foreground">Utilidad</div><div className="text-2xl font-bold text-primary">{fmt(gananciaSem - gastoSem)}</div></Card>
          </div>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Ventas por vendedor</h3>
            {porVendedor.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay vendedores registrados</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-1">Vendedor</th><th className="py-1 text-right">Ventas</th><th className="py-1 text-right">Total</th><th className="py-1 text-right">Comisión</th></tr></thead>
                <tbody>
                  {porVendedor.map((r) => (
                    <tr key={r.vendedor.id} className="border-t border-border">
                      <td className="py-2">{r.vendedor.nombre}</td>
                      <td className="py-2 text-right">{r.ventas}</td>
                      <td className="py-2 text-right">{fmt(r.total)}</td>
                      <td className="py-2 text-right text-emerald-600">{fmt(r.comision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
