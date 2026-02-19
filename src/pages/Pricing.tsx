import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";

const PricingPage = () => {
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

      <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-border/40 bg-card" style={{ height: "700px" }}>
        <iframe
          src="https://buy.stripe.com/3cI00jcdzer12eVeaj0Ny05"
          className="w-full h-full border-0"
          title="Stripe Checkout"
          allow="payment"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6">
        <Shield className="h-4 w-4" />
        <span>Garantia de 7 dias — cancele sem custo</span>
      </div>
    </div>
  );
};

export default PricingPage;
