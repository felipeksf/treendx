import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calculator, History, Newspaper, User, Shield, TrendingUp, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Calculadora", icon: Calculator, path: "/calculator" },
  { label: "Histórico", icon: History, path: "/history" },
  { label: "Agenda", icon: CalendarDays, path: "/agenda" },
  { label: "Notícias", icon: Newspaper, path: "/news" },
  { label: "Minha Conta", icon: User, path: "/account" },
];

const adminItem = { label: "Admin", icon: Shield, path: "/admin/users" };

const AppLayout = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const allItems = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b border-border">
          <TrendingUp className="h-7 w-7 text-primary" />
          <span className="text-xl font-display font-bold text-foreground">Treend</span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {allItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-20">
          <Link to="/dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-lg font-display font-bold text-foreground">Treend</span>
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-30">
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
