import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { Users, MessageSquare, CalendarDays, BarChart3, ArrowLeft, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Feed", icon: MessageSquare, path: "/admin/feed" },
  { label: "Agenda", icon: CalendarDays, path: "/admin/agenda" },
  { label: "Scores", icon: BarChart3, path: "/admin/scores" },
];

const AdminLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // TODO: replace with real auth role check via Supabase
  const isAdmin = true;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const SidebarContent = () => (
    <>
      {/* Logo / Title */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-display font-bold text-foreground">Admin Treend</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
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

      {/* Back to App */}
      <div className="px-3 py-4 border-t border-border">
        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
          <Button variant="outline" className="w-full gap-2 border-border text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o App
          </Button>
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col bg-card border-r border-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-display font-bold text-foreground">Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
