import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Users,
  Package,
  ClipboardList,
  Receipt,
  UsersRound,
  Wallet,
  HandCoins,
  Palette,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useStore } from "@/lib/store";

const groups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Negocios", url: "/negocios", icon: Store },
    ],
  },
  {
    label: "Operación",
    items: [
      { title: "Ventas", url: "/ventas", icon: ShoppingCart },
      { title: "Pedidos / Encargos", url: "/pedidos", icon: ClipboardList },
      { title: "Productos / Stock", url: "/productos", icon: Package },
      { title: "Clientes", url: "/clientes", icon: Users },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { title: "Cortes de caja", url: "/cortes", icon: Receipt },
      { title: "Gastos", url: "/gastos", icon: Wallet },
      { title: "Préstamos", url: "/prestamos", icon: HandCoins },
    ],
  },
  {
    label: "Equipo",
    items: [{ title: "Vendedores", url: "/vendedores", icon: UsersRound }],
  },
  {
    label: "Personalización",
    items: [
      { title: "Editor de Tickets", url: "/tickets", icon: Palette },
      { title: "Configuración", url: "/configuracion", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setSession } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setSession(false);
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-brand shadow-glow shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sidebar-foreground leading-tight">ChelonskySell</span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.url || pathname.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar sesión">
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
