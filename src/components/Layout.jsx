import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  Boxes,
  ChefHat,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useWallet } from "../hooks/useWallet.js";
import { formatUSD, formatVES } from "../utils/formatters.js";
import logoUrl from "../assets/logo_EntreLineas.svg";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tandas", label: "Tandas", icon: Package },
  { path: "/ventas", label: "Ventas", icon: ShoppingCart },
  { path: "/cuentas-cobrar", label: "Cuentas por Cobrar", icon: HandCoins },
  { path: "/inventario", label: "Inventario", icon: Boxes },
  { path: "/recetas", label: "Recetas", icon: ChefHat },
  { path: "/gastos", label: "Gastos", icon: Wallet },
  { path: "/conversiones", label: "Conversiones", icon: ArrowRightLeft },
  { path: "/comisiones", label: "Comisiones", icon: Percent },
  { path: "/usuarios", label: "Usuarios", icon: Users },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { ves, usd } = useWallet();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <div>
          <img src={logoUrl} alt="logo entrelineas" className="h-20 w-20 shrink-0 object-contain mx-auto"/>
          <h1 className="text-lg font-bold text-amber-500">EntreLíneas</h1>
          <p className="text-xs text-slate-400">Postres</p>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-100 text-amber-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-lg bg-slate-100 px-3 py-1.5 text-sm sm:flex">
              <span className="font-medium text-slate-700">{formatVES(ves)}</span>
              <span className="text-slate-300">|</span>
              <span className="font-medium text-slate-700">{formatUSD(usd)}</span>
            </div>
            <span className="hidden text-sm font-medium text-slate-700 md:block">
              {user?.name}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
