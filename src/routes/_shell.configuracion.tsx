import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Download, Upload, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_shell/configuracion")({
  component: Configuracion,
});

function Configuracion() {
  const { data, update, reset, setSession } = useStore();
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const cambiarPass = () => {
    if (pass.length < 4) return toast.error("Mínimo 4 caracteres");
    if (pass !== pass2) return toast.error("No coinciden");
    update((d) => ({ ...d, auth: d.auth ? { ...d.auth, pass } : null }));
    setPass(""); setPass2("");
    toast.success("Contraseña actualizada");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chelonskysell-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success("Respaldo descargado");
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        update(() => ({ ...parsed, session: true }));
        toast.success("Datos restaurados");
      } catch {
        toast.error("Archivo inválido");
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (!confirm("¿Borrar TODOS los datos? Esta acción no se puede deshacer.")) return;
    reset();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div>
      <PageHeader title="Configuración" description="Cuenta, respaldo y datos de la app" />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3"><KeyRound className="w-4 h-4 text-primary" /><h3 className="font-semibold">Cuenta</h3></div>
          <div className="text-sm text-muted-foreground mb-3">Usuario actual: <strong className="text-foreground">{data.auth?.user}</strong></div>
          <div className="space-y-3">
            <div><Label>Nueva contraseña</Label><Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
            <div><Label>Confirmar</Label><Input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} /></div>
            <Button onClick={cambiarPass}>Actualizar contraseña</Button>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => { setSession(false); navigate({ to: "/auth" }); }}>Cerrar sesión</Button>
          </div>
        </Card>

        <Card className="p-5 shadow-soft">
          <h3 className="font-semibold mb-3">Respaldo de datos</h3>
          <p className="text-xs text-muted-foreground mb-3">Tus datos viven en este dispositivo. Descarga respaldos para no perderlos.</p>
          <div className="space-y-2">
            <Button onClick={exportData} className="w-full"><Download className="w-4 h-4" /> Descargar respaldo</Button>
            <label className="block">
              <Button asChild variant="outline" className="w-full"><span><Upload className="w-4 h-4" /> Restaurar respaldo</span></Button>
              <input type="file" accept="application/json" className="hidden" onChange={importData} />
            </label>
          </div>
        </Card>

        <Card className="p-5 shadow-soft border-destructive/30 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-destructive" /><h3 className="font-semibold text-destructive">Zona peligrosa</h3></div>
          <p className="text-xs text-muted-foreground mb-3">Borra todos los datos: negocios, ventas, clientes y configuración.</p>
          <Button variant="destructive" onClick={resetAll}>Borrar todo</Button>
        </Card>

        <Card className="p-5 shadow-soft lg:col-span-2 bg-primary-soft border-primary/20">
          <h3 className="font-semibold mb-2">ChelonskySell</h3>
          <p className="text-sm text-muted-foreground">Versión 1.0 · Plataforma de gestión de ventas multi-negocio. Hecha para ti.</p>
        </Card>
      </div>
    </div>
  );
}
