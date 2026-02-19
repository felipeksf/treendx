import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import treendLogo from "@/assets/treend-logo.png";

const CHECKOUT_URL = "https://buy.stripe.com/3cI00jcdzer12eVeaj0Ny05";

const PricingPage = () => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);
    window.open(CHECKOUT_URL, "_blank");
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="inline-block mb-4 -my-4">
        <img src={treendLogo} alt="Treend" className="h-32 w-auto" />
      </Link>

      <h1 className="text-3xl font-display font-bold text-foreground text-center mb-2">
        Escolha seu plano
      </h1>
      <p className="text-muted-foreground text-center mb-10 max-w-md">
        Desbloqueie acesso completo à plataforma de consultoria cambial mais inteligente do Brasil.
      </p>

      <Button
        size="lg"
        onClick={handleCheckout}
        disabled={loading}
        className="h-14 px-10 text-base font-semibold rounded-xl"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Abrindo checkout...</>
        ) : (
          <><ExternalLink className="mr-2 h-5 w-5" /> Assinar agora</>
        )}
      </Button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-8">
        <Shield className="h-4 w-4" />
        <span>Garantia de 7 dias — cancele sem custo</span>
      </div>
    </div>
  );
};

export default PricingPage;
