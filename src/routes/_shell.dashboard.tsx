import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, GIROS } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import {
  Store,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Users,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_shell/dashboard")({
  component: Dashboard,
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function Dashboard() {
  const { data } = useStore();
  const negocioId = data.negocioActivoId;

  const ventas = negocioId
    ? data.ventas.filter((v) => v.negocioId === negocioId)
    : data.ventas;
  const gastos = negocioId
    ? data.gastos.filter((g) => g.negocioId === negocioId)
    : data.gastos;
  const pedidosPendientes = (negocioId
    ? data.pedidos.filter((p) => p.negocioId === negocioId)
    : data.pedidos
  ).filter((p) => p.estado !== "entregado" && p.estado !== "cancelado");

  const today = new Date().toISOString().slice(0, 10);
  const ventasHoy = ventas.filter((v) => v.fecha.slice(0, 10) === today);
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const totalVentas = ventas.reduce((s, v) => s + v.total, 0);
  const totalGanancia = ventas.reduce((s, v) => s + v.ganancia, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const utilidad = totalGanancia - totalGastos;
  const clientes = negocioId
    ? data.clientes.filter((c) => c.negocioId === negocioId)
    : data.clientes;

  if (data.negocios.length === 0) {
    return (
      <div>
        <PageHeader
          title="Bienvenido a ChelonskySell 👋"
          description="Empieza creando tu primer negocio para registrar ventas."
        />
        <EmptyState
          icon={Store}
          title="Aún no tienes negocios"
          description="Crea tu primer negocio para empezar a registrar ventas, clientes y mucho más."
          action={
            <Button asChild>
              <Link to="/negocios">
                <Store className="w-4 h-4" />
                Crear mi primer negocio
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const stats = [
    { label: "Ventas de hoy", value: fmt(totalHoy), sub: `${ventasHoy.length} tickets`, icon: ShoppingCart, color: "from-blue-500 to-blue-600" },
    { label: "Ventas totales", value: fmt(totalVentas), sub: `${ventas.length} en total`, icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
    { label: "Utilidad neta", value: fmt(utilidad), sub: `Ganancia − Gastos`, icon: Wallet, color: "from-violet-500 to-violet-600" },
    { label: "Clientes", value: String(clientes.length), sub: `${clientes.filter(c=>c.favorito).length} favoritos`, icon: Users, color: "from-orange-500 to-orange-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          negocioId
            ? `Vista del negocio activo`
            : "Vista global de todos tus negocios"
        }
        actions={
          <Button asChild>
            <Link to="/ventas">
              <ShoppingCart className="w-4 h-4" />
              Nueva venta
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 shadow-soft border-border/60">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl sm:text-2xl font-bold mt-1 truncate">{s.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
              </div>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Últimas ventas</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ventas">Ver todas <ArrowRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          {ventas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin ventas aún</p>
          ) : (
            <div className="space-y-2">
              {ventas.slice(-5).reverse().map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {v.clienteNombre || "Cliente mostrador"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(v.fecha).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                      {" · "}{v.items.length} ítem(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{fmt(v.total)}</div>
                    <div className="text-[11px] text-emerald-600">+{fmt(v.ganancia)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pedidos pendientes</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/pedidos"><ArrowRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          {pedidosPendientes.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin pedidos pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidosPendientes.slice(0, 5).map((p) => (
                <div key={p.id} className="p-2.5 rounded-lg bg-muted/40">
                  <div className="text-sm font-medium truncate">{p.clienteNombre}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.descripcion}</div>
                  <div className="text-[11px] mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning-foreground">
                      {p.estado.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Mis negocios</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.negocios.map((n) => {
            const g = GIROS.find((x) => x.value === n.giro);
            const nVentas = data.ventas.filter((v) => v.negocioId === n.id).length;
            return (
              <Card key={n.id} className="p-4 shadow-soft hover:shadow-glow transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: n.color + "22", color: n.color }}
                  >
                    {g?.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{n.nombre}</div>
                    <div className="text-xs text-muted-foreground">{g?.label} · {nVentas} ventas</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
