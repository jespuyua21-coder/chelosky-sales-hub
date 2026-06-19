import { forwardRef } from "react";
import type { Negocio, Venta } from "@/lib/store";
import { GIROS } from "@/lib/store";

interface Props {
  negocio: Negocio;
  venta: Venta;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export const TicketPreview = forwardRef<HTMLDivElement, Props>(({ negocio, venta }, ref) => {
  const cfg = negocio.ticketConfig;
  const g = GIROS.find((x) => x.value === negocio.giro);

  return (
    <div
      ref={ref}
      className="mx-auto"
      style={{
        width: 340,
        backgroundColor: cfg.bgColor,
        color: cfg.textColor,
        fontFamily: cfg.font,
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ textAlign: "center", borderBottom: `2px dashed ${cfg.headerColor}`, paddingBottom: 12, marginBottom: 12 }}>
        {cfg.showLogo && (
          <div
            style={{
              width: 56, height: 56, borderRadius: 12,
              backgroundColor: cfg.headerColor + "22",
              color: cfg.headerColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 8px",
            }}
          >{g?.emoji}</div>
        )}
        <div style={{ fontWeight: 800, fontSize: 20, color: cfg.headerColor }}>{negocio.nombre}</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{g?.label}</div>
        {negocio.telefono && <div style={{ fontSize: 11, opacity: 0.7 }}>Tel: {negocio.telefono}</div>}
      </div>

      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
        <span>Ticket #{venta.id.slice(0, 6).toUpperCase()}</span>
        <span>{new Date(venta.fecha).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
      </div>

      {venta.clienteNombre && (
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          <strong>Cliente:</strong> {venta.clienteNombre}
        </div>
      )}

      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${cfg.headerColor}33` }}>
            <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 600 }}>Producto</th>
            <th style={{ textAlign: "center", padding: "4px 0", fontWeight: 600 }}>Cant</th>
            <th style={{ textAlign: "right", padding: "4px 0", fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((it, i) => (
            <tr key={i}>
              <td style={{ padding: "4px 0" }}>{it.nombre}</td>
              <td style={{ textAlign: "center", padding: "4px 0" }}>{it.cantidad}</td>
              <td style={{ textAlign: "right", padding: "4px 0" }}>{fmt(it.precio * it.cantidad)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: `2px dashed ${cfg.headerColor}`, marginTop: 10, paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, color: cfg.headerColor }}>
          <span>TOTAL</span>
          <span>{fmt(venta.total)}</span>
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, textTransform: "capitalize" }}>
          Pago: {venta.metodoPago} · {venta.pagada ? "Pagado" : "Pendiente"}
        </div>
      </div>

      {cfg.footer && (
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, opacity: 0.8, fontStyle: "italic" }}>
          {cfg.footer}
        </div>
      )}
    </div>
  );
});
TicketPreview.displayName = "TicketPreview";

export function ticketToText(negocio: Negocio, venta: Venta): string {
  const lines: string[] = [];
  lines.push(`*${negocio.nombre.toUpperCase()}*`);
  if (negocio.telefono) lines.push(`Tel: ${negocio.telefono}`);
  lines.push(`Ticket #${venta.id.slice(0, 6).toUpperCase()}`);
  lines.push(new Date(venta.fecha).toLocaleString("es-MX"));
  if (venta.clienteNombre) lines.push(`Cliente: ${venta.clienteNombre}`);
  lines.push("--------------------------------");
  for (const it of venta.items) {
    lines.push(`${it.cantidad}x ${it.nombre}`);
    lines.push(`   ${fmt(it.precio)} c/u → ${fmt(it.precio * it.cantidad)}`);
  }
  lines.push("--------------------------------");
  lines.push(`*TOTAL: ${fmt(venta.total)}*`);
  lines.push(`Pago: ${venta.metodoPago} · ${venta.pagada ? "Pagado" : "Pendiente"}`);
  if (negocio.ticketConfig.footer) {
    lines.push("");
    lines.push(negocio.ticketConfig.footer);
  }
  return lines.join("\n");
}
