import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, LogOut, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AccountPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [subStatus, setSubStatus] = useState<string>("trial");
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
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
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados!" });
    }
    setSaving(false);
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Minha Conta</h1>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <User className="h-5 w-5 text-primary" />
            Dados pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={email} readOnly className="bg-muted" />
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <CreditCard className="h-5 w-5 text-primary" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColors[subStatus] || ""}>
              {statusLabels[subStatus] || subStatus}
            </Badge>
            {subStatus === "trial" && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {daysLeft} dias restantes
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate("/pricing")}>
            Gerenciar Assinatura
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full text-treend-danger border-treend-danger/20 hover:bg-treend-danger/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );
};

export default AccountPage;
