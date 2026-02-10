import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PricingCard from "@/components/PricingCard";
import treendLogo from "@/assets/treend-logo.png";

const features = [
  "Score diário USD e EUR",
  "Calculadora de timing cambial",
  "Histórico de decisões",
  "Feed de notícias cambiais",
  "Comentários diários de especialistas",
];

const PricingPage = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      toast({ title: "Faça login primeiro", description: "Você precisa estar logado para assinar.", variant: "destructive" });
      return;
    }
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erro ao iniciar checkout", description: err.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (productId: string) => subscription.subscribed && subscription.productId === productId;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <img src={treendLogo} alt="Treend" className="h-10 w-auto" />
      </Link>

      <h1 className="text-3xl font-display font-bold text-foreground text-center mb-2">
        Escolha seu plano
      </h1>
      <p className="text-muted-foreground text-center mb-10 max-w-md">
        Desbloqueie acesso completo à plataforma de consultoria cambial mais inteligente do Brasil.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        <PricingCard
          name={STRIPE_PLANS.monthly.name}
          price={STRIPE_PLANS.monthly.price}
          period={STRIPE_PLANS.monthly.period}
          features={features}
          onSelect={() => handleCheckout(STRIPE_PLANS.monthly.priceId)}
          isCurrentPlan={isCurrentPlan(STRIPE_PLANS.monthly.productId)}
          loading={loading === STRIPE_PLANS.monthly.priceId}
        />
        <PricingCard
          name={STRIPE_PLANS.annual.name}
          price={STRIPE_PLANS.annual.price}
          period={STRIPE_PLANS.annual.period}
          features={[...features, "Economia de 50% vs mensal"]}
          highlighted
          badge="Melhor custo-benefício"
          onSelect={() => handleCheckout(STRIPE_PLANS.annual.priceId)}
          isCurrentPlan={isCurrentPlan(STRIPE_PLANS.annual.productId)}
          loading={loading === STRIPE_PLANS.annual.priceId}
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
