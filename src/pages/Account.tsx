import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, LogOut, Clock, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AccountPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [subStatus, setSubStatus] = useState<string>("trial");
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, subscription_status, trial_expires_at")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setName(data.full_name || "");
        setSubStatus(data.subscription_status);
        setTrialExpiresAt(data.trial_expires_at);
      }
    };
    fetchProfile();
  }, [user]);

  const daysLeft = trialExpiresAt
    ? Math.max(0, Math.ceil((new Date(trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados!" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: "Preencha ambos os campos", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const statusColors: Record<string, string> = {
    trial: "bg-primary/10 text-primary border-primary/20",
    active: "bg-treend-success/10 text-treend-success border-treend-success/20",
    expired: "bg-treend-danger/10 text-treend-danger border-treend-danger/20",
  };

  const statusLabels: Record<string, string> = {
    trial: "Trial gratuito",
    active: "Assinatura ativa",
    expired: "Expirado",
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Minha Conta</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus dados e assinatura</p>
      </div>

      {/* Personal data */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Dados pessoais</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm bg-muted/40 border-border/40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">E-mail</Label>
          <Input value={email} readOnly className="h-9 text-sm bg-muted/60 border-border/40" />
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs">
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Salvar alterações
        </Button>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Assinatura</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={statusColors[subStatus] || ""}>
            {statusLabels[subStatus] || subStatus}
          </Badge>
          {subStatus === "trial" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {daysLeft} dias restantes
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="h-8 text-xs">
          Gerenciar Assinatura
        </Button>
      </div>

      {/* Password */}
      <div className="rounded-2xl bg-card border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Redefinir Senha</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Nova Senha</Label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-9 text-sm bg-muted/40 border-border/40 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Confirmar Nova Senha</Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="h-9 text-sm bg-muted/40 border-border/40 pr-9"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button size="sm" onClick={handleChangePassword} disabled={savingPassword} className="h-8 text-xs">
          {savingPassword && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Alterar Senha
        </Button>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-treend-danger bg-treend-danger/5 border border-treend-danger/15 hover:bg-treend-danger/10 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </div>
  );
};

export default AccountPage;
