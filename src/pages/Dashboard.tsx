import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ScoreGauge from "@/components/ScoreGauge";
import TrialBanner from "@/components/TrialBanner";
import { Calculator, History, Newspaper, DollarSign, Euro, MessageSquare } from "lucide-react";

const mockData = {
  usd: { score: 35, zone: "Barato", rate: 5.12 },
  eur: { score: 62, zone: "Caro", rate: 5.58 },
  comment: "Dólar em zona favorável para compra. Momento pode ser interessante para quem precisa fechar câmbio em USD. Euro segue pressionado acima da média.",
  trialDays: 5,
};

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>

      <TrialBanner daysLeft={mockData.trialDays} />

      {/* Score Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <DollarSign className="h-5 w-5 text-primary" />
              USD/BRL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={mockData.usd.score} zone={mockData.usd.zone} />
            <p className="mt-3 text-2xl font-display font-bold text-foreground">R$ {mockData.usd.rate.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cotação do dia</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Euro className="h-5 w-5 text-primary" />
              EUR/BRL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreGauge score={mockData.eur.score} zone={mockData.eur.zone} />
            <p className="mt-3 text-2xl font-display font-bold text-foreground">R$ {mockData.eur.rate.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Cotação do dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Comment */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <MessageSquare className="h-5 w-5 text-primary" />
            Comentário do dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{mockData.comment}</p>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Calculadora", icon: Calculator, path: "/calculator" },
          { label: "Histórico", icon: History, path: "/history" },
          { label: "Notícias", icon: Newspaper, path: "/news" },
        ].map((item) => (
          <Link key={item.path} to={item.path}>
            <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                <item.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
