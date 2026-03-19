import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import nattiotLogo from "@/assets/nattiot-logo.png";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Inventory", path: "/inventory", icon: Package },
  { title: "Orders", path: "/orders", icon: ClipboardList },
  { title: "Analytics", path: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 h-16 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <img src={nattiotLogo} alt="Nattiot" className={cn("transition-all", collapsed ? "h-8" : "h-9")} />
        {!collapsed && <span className="font-semibold text-foreground tracking-tight text-lg">Inventory</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </RouterNavLink>
        ))}
      </nav>

      {/* Low stock indicator */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-status-warning-bg">
          <div className="flex items-center gap-2 text-status-warning text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>3 items low stock</span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}
