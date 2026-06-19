import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Lock } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: Auth,
});

function Auth() {
  const { data, hydrated, update, setSession } = useStore();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  const isSetup = hydrated && !data.auth;

  useEffect(() => {
    if (hydrated && data.session) navigate({ to: "/dashboard", replace: true });
  }, [hydrated, data.session, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetup) {
      if (!user || !pass) return toast.error("Completa los datos");
      if (pass !== pass2) return toast.error("Las contraseñas no coinciden");
      update((d) => ({ ...d, auth: { user, pass }, session: true }));
      toast.success("¡Cuenta de administrador creada!");
      navigate({ to: "/dashboard", replace: true });
    } else {
      if (data.auth?.user === user && data.auth?.pass === pass) {
        setSession(true);
        toast.success(`Bienvenido, ${user}`);
        navigate({ to: "/dashboard", replace: true });
      } else {
        toast.error("Usuario o contraseña incorrectos");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-soft via-background to-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-brand shadow-glow mb-4">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-brand">ChelonskySell</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu plataforma de gestión de ventas
          </p>
        </div>
        <Card className="p-6 shadow-soft">
          <h2 className="text-xl font-semibold mb-1">
            {isSetup ? "Crea tu cuenta" : "Iniciar sesión"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isSetup
              ? "Define tu usuario y contraseña de administrador"
              : "Ingresa tus credenciales"}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="user">Usuario</Label>
              <Input
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div>
              <Label htmlFor="pass">Contraseña</Label>
              <Input
                id="pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete={isSetup ? "new-password" : "current-password"}
              />
            </div>
            {isSetup && (
              <div>
                <Label htmlFor="pass2">Confirmar contraseña</Label>
                <Input
                  id="pass2"
                  type="password"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              <Lock className="w-4 h-4" />
              {isSetup ? "Crear cuenta" : "Entrar"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Tus datos se guardan localmente en este dispositivo
        </p>
      </div>
    </div>
  );
}
