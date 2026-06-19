import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useStore, GIROS } from "@/lib/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  const { data, hydrated, setNegocioActivo } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !data.session) navigate({ to: "/auth", replace: true });
  }, [hydrated, data.session, navigate]);

  if (!hydrated || !data.session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Cargando…</div>
      </div>
    );
  }

  const activo = data.negocios.find((n) => n.id === data.negocioActivoId);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="h-14 sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-muted-foreground hidden sm:inline">Negocio activo:</span>
              {data.negocios.length === 0 ? (
                <span className="text-sm text-muted-foreground">Aún no hay negocios</span>
              ) : (
                <Select
                  value={data.negocioActivoId ?? ""}
                  onValueChange={(v) => setNegocioActivo(v || null)}
                >
                  <SelectTrigger className="h-8 w-[200px] text-sm">
                    <SelectValue placeholder="Selecciona negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.negocios.map((n) => {
                      const g = GIROS.find((x) => x.value === n.giro);
                      return (
                        <SelectItem key={n.id} value={n.id}>
                          {g?.emoji} {n.nombre}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="text-xs text-muted-foreground hidden md:block">
              {data.auth?.user}
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
