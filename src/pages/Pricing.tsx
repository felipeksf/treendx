import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import treendLogo from "@/assets/treend-logo.png";
import loginMarketVideo from "@/assets/login-market-video.mp4";

const CHECKOUT_URL = "https://buy.stripe.com/3cI00jcdzer12eVeaj0Ny05";

const PricingPage = () => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);
    window.open(CHECKOUT_URL, "_blank");
    setTimeout(() => setLoading(false), 2000);
  };

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

          <Button
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-14 text-base font-semibold rounded-xl"
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
