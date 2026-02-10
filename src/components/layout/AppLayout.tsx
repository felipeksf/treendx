import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  History,
  Newspaper,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import AppSidebar from "./AppSidebar";
import treendLogo from "@/assets/treend-logo.png";

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
  const [profile, setProfile] = useState<ProfileType>("importer");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <AppSidebar profile={profile} onProfileChange={setProfile} />

      {/* Main content */}
      <div className="flex-1 md:ml-[72px] lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-20">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={treendLogo} alt="Treend" className="h-10 w-auto" />
          </Link>
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
