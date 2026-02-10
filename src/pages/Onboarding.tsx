import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Calculator, ArrowRight, ArrowLeft } from "lucide-react";

const steps = [
  {
    icon: TrendingUp,
    title: "Bem-vindo à Treend!",
    desc: "Somos seu consultor de timing cambial. Ajudamos você a entender se o momento é favorável ou desfavorável para operar com dólar e euro.",
  },
  {
    icon: Target,
    title: "Entenda o Score",
    desc: "O Score Treend posiciona o câmbio em zonas coloridas de 1 a 100. Verde indica zona favorável, amarelo é neutro e vermelho indica zona desfavorável.",
  },
  {
    icon: Calculator,
    title: "Use a Calculadora",
    desc: "Simule quanto você pode economizar operando no timing certo. Registre suas decisões e acompanhe a economia acumulada ao longo do tempo.",
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-lg bg-card border-border">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`} />
            ))}
          </div>

          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <current.icon className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-2xl font-display font-bold text-foreground mb-4">{current.title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">{current.desc}</p>

          <div className="flex items-center justify-center gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
            {isLast ? (
              <Button onClick={() => navigate("/dashboard")}>
                Ir para o Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setStep(step + 1)}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
