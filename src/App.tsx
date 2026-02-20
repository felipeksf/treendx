import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import History from "./pages/History";
import News from "./pages/News";
import Feed from "./pages/Feed";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Agenda from "./pages/Agenda";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./components/layout/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeed from "./pages/admin/AdminFeed";
import AdminAgenda from "./pages/AdminAgenda";
import AdminScores from "./pages/admin/AdminScores";
import AdminTutorials from "./pages/admin/AdminTutorials";
import AdminHeatmap from "./pages/admin/AdminHeatmap";
import AdminTaxa from "./pages/admin/AdminTaxa";
import Tutorials from "./pages/Tutorials";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/history" element={<History />} />
                <Route path="/news" element={<News />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/tutorials" element={<Tutorials />} />
                <Route path="/account" element={<Account />} />
              </Route>
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="/admin/heatmap" replace />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="feed" element={<AdminFeed />} />
                <Route path="agenda" element={<AdminAgenda />} />
                <Route path="scores" element={<AdminScores />} />
                <Route path="tutorials" element={<AdminTutorials />} />
                <Route path="heatmap" element={<AdminHeatmap />} />
                <Route path="taxa" element={<AdminTaxa />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
