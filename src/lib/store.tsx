import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ============ Types ============
export type Giro =
  | "ventas_online"
  | "boletaje"
  | "servicios"
  | "ventas_vip"
  | "ventas_licor"
  | "tienda_ropa"
  | "otro";

export const GIROS: { value: Giro; label: string; emoji: string }[] = [
  { value: "ventas_online", label: "Ventas Online", emoji: "🛒" },
  { value: "boletaje", label: "Boletaje", emoji: "🎫" },
  { value: "servicios", label: "Servicios", emoji: "🛠️" },
  { value: "ventas_vip", label: "Ventas VIP", emoji: "💎" },
  { value: "ventas_licor", label: "Ventas de Licor", emoji: "🍾" },
  { value: "tienda_ropa", label: "Tienda de Ropa", emoji: "👗" },
  { value: "otro", label: "Otro", emoji: "🏪" },
];

export interface Negocio {
  id: string;
  nombre: string;
  giro: Giro;
  telefono?: string;
  direccion?: string;
  color: string; // brand color
  ticketConfig: TicketConfig;
  createdAt: string;
}

export interface TicketConfig {
  font: string;
  headerColor: string;
  textColor: string;
  bgColor: string;
  showLogo: boolean;
  footer: string;
}

export interface Producto {
  id: string;
  negocioId: string;
  nombre: string;
  precio: number;
  costo: number;
  stock: number;
  categoria?: string;
}

export interface Cliente {
  id: string;
  negocioId: string;
  nombre: string;
  telefono?: string;
  favorito: boolean;
  notas?: string;
}

export interface VentaItem {
  productoId: string;
  nombre: string;
  precio: number;
  costo: number;
  cantidad: number;
}

export interface Venta {
  id: string;
  negocioId: string;
  clienteId?: string;
  clienteNombre?: string;
  vendedorId?: string;
  items: VentaItem[];
  total: number;
  ganancia: number;
  metodoPago: "efectivo" | "transferencia" | "tarjeta" | "credito";
  pagada: boolean;
  fecha: string;
  notas?: string;
}

export interface Pedido {
  id: string;
  negocioId: string;
  clienteNombre: string;
  telefono?: string;
  descripcion: string;
  monto?: number;
  estado: "pendiente" | "en_proceso" | "listo" | "entregado" | "cancelado";
  fechaPedido: string;
  fechaEntrega?: string;
}

export interface Vendedor {
  id: string;
  negocioId: string;
  nombre: string;
  telefono?: string;
  sueldoBase: number;
  comisionPct: number;
  activo: boolean;
}

export interface Asistencia {
  id: string;
  vendedorId: string;
  fecha: string; // YYYY-MM-DD
  presente: boolean;
  notas?: string;
}

export interface Adelanto {
  id: string;
  vendedorId: string;
  monto: number;
  fecha: string;
  descripcion?: string;
}

export interface Gasto {
  id: string;
  negocioId: string;
  categoria: "gasolina" | "comidas" | "negocio" | "renta" | "servicios" | "otro";
  monto: number;
  descripcion: string;
  fecha: string;
}

export interface Prestamo {
  id: string;
  negocioId: string;
  clienteNombre: string;
  telefono?: string;
  monto: number;
  interesPct: number;
  fechaPrestamo: string;
  fechaPago: string;
  pagado: boolean;
  notas?: string;
}

export interface AppData {
  negocios: Negocio[];
  productos: Producto[];
  clientes: Cliente[];
  ventas: Venta[];
  pedidos: Pedido[];
  vendedores: Vendedor[];
  asistencias: Asistencia[];
  adelantos: Adelanto[];
  gastos: Gasto[];
  prestamos: Prestamo[];
  auth: { user: string; pass: string } | null;
  session: boolean;
  negocioActivoId: string | null;
}

const STORAGE_KEY = "chelonskysell:data:v1";

const DEFAULT_TICKET: TicketConfig = {
  font: "Plus Jakarta Sans",
  headerColor: "#0F4C81",
  textColor: "#1F2937",
  bgColor: "#FFFFFF",
  showLogo: true,
  footer: "¡Gracias por tu compra!",
};

const initialData: AppData = {
  negocios: [],
  productos: [],
  clientes: [],
  ventas: [],
  pedidos: [],
  vendedores: [],
  asistencias: [],
  adelantos: [],
  gastos: [],
  prestamos: [],
  auth: null,
  session: false,
  negocioActivoId: null,
};

function loadData(): AppData {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialData;
    const parsed = JSON.parse(raw);
    return { ...initialData, ...parsed, session: false };
  } catch {
    return initialData;
  }
}

function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface StoreContext {
  data: AppData;
  hydrated: boolean;
  update: (fn: (d: AppData) => AppData) => void;
  setSession: (v: boolean) => void;
  setNegocioActivo: (id: string | null) => void;
  reset: () => void;
}

const Ctx = createContext<StoreContext | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  const update = (fn: (d: AppData) => AppData) => setData((d) => fn(d));
  const setSession = (v: boolean) => setData((d) => ({ ...d, session: v }));
  const setNegocioActivo = (id: string | null) =>
    setData((d) => ({ ...d, negocioActivoId: id }));
  const reset = () => {
    setData(initialData);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Ctx.Provider value={{ data, hydrated, update, setSession, setNegocioActivo, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export { DEFAULT_TICKET };
