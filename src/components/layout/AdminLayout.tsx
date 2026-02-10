import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Users, MessageSquare, CalendarDays, BarChart3, ArrowLeft, Shield, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";

const adminNavItems = [
  { label: "Usuários", icon: Users, path: "/admin/users" },
  { label: "Feed", icon: MessageSquare, path: "/admin/feed" },
  { label: "Agenda", icon: CalendarDays, path: "/admin/agenda" },
  { label: "Scores", icon: BarChart3, path: "/admin/scores" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Sessão encerrada com sucesso" });
    navigate("/");
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border/50">
        <img src={treendLogo} alt="Treend" className="h-6 w-auto" />
        <span className="text-lg font-display font-bold text-foreground">Admin</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border/50 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-display font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {theme === "dark" ? "Modo Light" : "Modo Dark"}
        </button>

        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
          <Button variant="outline" className="w-full gap-2 border-border text-muted-foreground hover:text-foreground font-display">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o App
          </Button>
        </Link>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 font-display min-h-[40px]"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col h-full m-2 rounded-3xl border border-border/50 glass-effect overflow-hidden">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col glass-effect border-r border-border/50 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
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
