import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data, hydrated } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (data.session) navigate({ to: "/dashboard", replace: true });
    else navigate({ to: "/auth", replace: true });
  }, [hydrated, data.session, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-3xl font-bold text-gradient-brand">ChelonskySell</div>
        <div className="mt-2 text-sm text-muted-foreground">Cargando…</div>
      </div>
    </div>
  );
}
