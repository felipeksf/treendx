import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Newspaper, MessageSquare, CalendarDays, Calculator, History, ShieldCheck, ChevronLeft, ChevronRight, MoreHorizontal, LogOut, User, Moon, Sun, PlayCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import treendLogo from "@/assets/treend-logo.png";

type ProfileType = "importer" | "exporter";
interface AppSidebarProps {
  profile: ProfileType;
  onProfileChange: (p: ProfileType) => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Feed", icon: MessageSquare, path: "/feed" },
  { label: "Notícias", icon: Newspaper, path: "/news" },
  { label: "Agenda", icon: CalendarDays, path: "/agenda", badge: 2, badgeColor: "bg-treend-success" },
  { label: "Calculadora", icon: Calculator, path: "/calculator" },
  { label: "Histórico", icon: History, path: "/history" },
  { label: "Tutoriais", icon: PlayCircle, path: "/tutorials" },
];

const adminItem = { label: "Admin", icon: ShieldCheck, path: "/admin/users" };

const AppSidebar = ({ profile, onProfileChange }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const allItems = isAdmin ? [...navItems, adminItem] : navItems;

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
    toast({ title: "Sessão encerrada com sucesso" });
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "";

  return (
    <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"}`}>
      <div className="flex flex-col h-full m-2 rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 -my-2 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <img src={treendLogo} alt="Treend" className="h-36 w-auto shrink-0 object-contain -my-4" />
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {allItems.map(item => {
            const active = location.pathname === item.path;
            const badge = "badge" in item ? (item as any).badge as number : undefined;
            const badgeColor = "badgeColor" in item ? (item as any).badgeColor as string : undefined;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] tracking-wide font-normal transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {badge !== undefined && (
                      <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground ${badgeColor}`}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge !== undefined && (
                  <span className={`absolute left-12 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-primary-foreground ${badgeColor}`}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-2.5 py-3 space-y-1.5">
          <button onClick={toggleTheme} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] tracking-wide font-normal text-muted-foreground/70 hover:bg-secondary/50 hover:text-foreground transition-all duration-200">
            {theme === "dark" ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
            {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
          </button>

          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-display font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-display font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-48 bg-popover border-border z-50">
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
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;