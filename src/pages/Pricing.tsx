import { Link } from "react-router-dom";
import PricingCard from "@/components/PricingCard";
import { Shield, TrendingUp } from "lucide-react";

const features = [
  "Score diário USD e EUR",
  "Calculadora de timing cambial",
  "Histórico de decisões",
  "Feed de notícias cambiais",
  "Comentários diários de especialistas",
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <TrendingUp className="h-8 w-8 text-primary" />
        <span className="text-2xl font-display font-bold text-foreground">Treend</span>
      </Link>

      <h1 className="text-3xl font-display font-bold text-foreground text-center mb-2">
        Escolha seu plano
      </h1>
      <p className="text-muted-foreground text-center mb-10 max-w-md">
        Desbloqueie acesso completo à plataforma de consultoria cambial mais inteligente do Brasil.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        <PricingCard
          name="Mensal"
          price="R$49,90"
          period="mês"
          features={features}
        />
        <PricingCard
          name="Anual"
          price="R$299"
          period="ano"
          features={[...features, "Economia de 50% vs mensal"]}
          highlighted
          badge="Melhor custo-benefício"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Garantia de 7 dias — cancele sem custo</span>
      </div>
    </div>
  );
};

export default PricingPage;
