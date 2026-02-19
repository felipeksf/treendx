import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  History,
  Newspaper,
  CalendarDays,
  User,
  LogOut,
  MoreVertical,
} from "lucide-react";
import AppSidebar from "./AppSidebar";
import treendLogo from "@/assets/treend-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProfileType = "importer" | "exporter";

const mobileNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Feed", icon: Newspaper, path: "/news" },
  { label: "Agenda", icon: CalendarDays, path: "/agenda" },
  { label: "Calculadora", icon: Calculator, path: "/calculator" },
  { label: "Histórico", icon: History, path: "/history" },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType>("importer");
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
    toast({ title: "Sessão encerrada com sucesso" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar profile={profile} onProfileChange={setProfile} />

      {/* Main content */}
      <div className="flex-1 md:ml-[72px] lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 border-b border-border bg-card sticky top-0 z-20 py-0">
          <Link to="/dashboard" className="flex items-center leading-none">
            <img src={treendLogo} alt="Treend" className="h-28 w-auto -my-4" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-display font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
              <DropdownMenuItem onClick={() => navigate("/account")} className="gap-2 font-display cursor-pointer">
                <User className="h-4 w-4" />
                Minha Conta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="gap-2 font-display text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet context={{ profile }} />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-30">
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors duration-200 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-display">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
