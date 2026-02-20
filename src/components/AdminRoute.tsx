import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isAdmin, isEditor, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Editors can only access heatmap
  if (isEditor && !isAdmin) {
    const allowed = ["/admin/heatmap", "/admin"];
    const isAllowed = allowed.some(p => location.pathname.startsWith(p) && (location.pathname === p || location.pathname === "/admin/heatmap"));
    if (!isAllowed) {
      return <Navigate to="/admin/heatmap" replace />;
    }
    return <>{children}</>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
