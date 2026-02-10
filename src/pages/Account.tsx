import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, LogOut, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AccountPage = () => {
  const [name, setName] = useState("João Silva");
  const [email, setEmail] = useState("joao@empresa.com");
  const { toast } = useToast();
  const navigate = useNavigate();

  const mockSub = { status: "trial" as const, daysLeft: 5 };

  const statusColors: Record<string, string> = {
    trial: "bg-primary/10 text-primary border-primary/20",
    ativo: "bg-treend-success/10 text-treend-success border-treend-success/20",
    expirado: "bg-treend-danger/10 text-treend-danger border-treend-danger/20",
  };

  const statusLabels: Record<string, string> = {
    trial: "Trial gratuito",
    ativo: "Assinatura ativa",
    expirado: "Expirado",
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Minha Conta</h1>

      {/* Profile */}
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
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button
            size="sm"
            onClick={() => toast({ title: "Dados atualizados!" })}
          >
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <CreditCard className="h-5 w-5 text-primary" />
            Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColors[mockSub.status]}>
              {statusLabels[mockSub.status]}
            </Badge>
            {mockSub.status === "trial" && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {mockSub.daysLeft} dias restantes
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate("/pricing")}>
            Gerenciar Assinatura
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-treend-danger border-treend-danger/20 hover:bg-treend-danger/10"
        onClick={() => navigate("/login")}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );
};

export default AccountPage;
