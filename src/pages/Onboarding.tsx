import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Calculator, ArrowRight, ArrowLeft } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";
import loginMarketVideo from "@/assets/login-market-video.mp4";
const steps = [{
  icon: TrendingUp,
  title: "Bem-vindo à Treend!",
  desc: "Somos seu consultor de timing cambial. Ajudamos você a entender se o momento é favorável ou desfavorável para operar com dólar e euro."
}, {
  icon: Target,
  title: "Entenda o Score",
  desc: "O Score Treend posiciona o câmbio em zonas coloridas de 1 a 100. Verde indica zona favorável, amarelo é neutro e vermelho indica zona desfavorável."
}, {
  icon: Calculator,
  title: "Use a Calculadora",
  desc: "Simule quanto você pode economizar operando no timing certo. Registre suas decisões e acompanhe a economia acumulada ao longo do tempo."
}];
const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[step];
  const isLast = step === steps.length - 1;
  return <div className="min-h-screen flex">
      {/* Left Panel - Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link to="/" className="inline-block mb-4 -my-4">
            <img src={treendLogo} alt="Treend" className="h-32 w-auto" />
          </Link>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`} />)}
          </div>

          {/* Icon */}
          

          {/* Title & Description */}
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-4">
            {current.title}
          </h1>
          <p className="text-muted-foreground mb-8">
            {current.desc}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {step > 0 && <Button variant="outline" className="h-12" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>}
            {isLast ? <Button className="h-12 text-base font-semibold" onClick={() => navigate("/dashboard")}>
                Ir para o Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button> : <Button className="h-12 text-base font-semibold" onClick={() => setStep(step + 1)}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>}
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
    </div>;
};
export default Onboarding;