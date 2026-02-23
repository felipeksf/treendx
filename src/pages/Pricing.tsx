import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import treendLogo from "@/assets/treend-logo.png";
import loginMarketVideo from "@/assets/login-market-video.mp4";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PricingPage = () => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = async (planKey: "monthly" | "annual") => {
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PLANS[planKey].priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      toast({
        title: "Erro ao iniciar checkout",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentProductId = subscription.productId;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-block mb-4 -my-4">
            <img src={treendLogo} alt="Treend" className="h-32 w-auto" />
          </Link>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground mb-8">
            Desbloqueie acesso completo à plataforma de consultoria cambial mais inteligente do Brasil.
          </p>

          {/* Monthly Plan */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleCheckout("monthly")}
            disabled={loadingPlan !== null || currentProductId === STRIPE_PLANS.monthly.productId}
            className="w-full h-14 text-base font-semibold rounded-xl mb-3"
          >
            {loadingPlan === "monthly" ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Abrindo checkout...</>
            ) : currentProductId === STRIPE_PLANS.monthly.productId ? (
              "Plano atual — Mensal R$49,90/mês"
            ) : (
              <>Mensal — R$49,90/mês</>
            )}
          </Button>

          {/* Annual Plan */}
          <Button
            size="lg"
            onClick={() => handleCheckout("annual")}
            disabled={loadingPlan !== null || currentProductId === STRIPE_PLANS.annual.productId}
            className="w-full h-14 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loadingPlan === "annual" ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Abrindo checkout...</>
            ) : currentProductId === STRIPE_PLANS.annual.productId ? (
              "Plano atual — Anual R$299/ano"
            ) : (
              <>Anual — R$299/ano <span className="ml-2 text-xs opacity-80">(economize 50%)</span></>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 text-base font-semibold rounded-xl mt-3"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            <ExternalLink className="mr-2 h-5 w-5" /> Acessar a Plataforma
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-8">
            <Shield className="h-4 w-4" />
            <span>Garantia de 7 dias — cancele sem custo</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Video */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={loginMarketVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-primary/60" />
      </div>
    </div>
  );
};

export default PricingPage;
