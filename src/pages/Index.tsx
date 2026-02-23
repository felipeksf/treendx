import { Link, useNavigate } from "react-router-dom";
import treendLogo from "@/assets/treend-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PricingCard from "@/components/PricingCard";
import { useAuth, STRIPE_PLANS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Target,
  Calculator,
  ShoppingCart,
  Briefcase,
  Code,
  Store,
  ArrowRight,
  Shield,
} from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Score diário",
    desc: "Saiba se o dólar ou euro está em zona de pressão ou de equilíbrio para operações.",
  },
  {
    icon: Calculator,
    title: "Calculadora inteligente",
    desc: "Simule quanto você pode economizar comprando no timing certo.",
  },
  {
    icon: BarChart3,
    title: "Histórico de decisões",
    desc: "Registre suas operações e acompanhe sua economia acumulada.",
  },
  {
    icon: Shield,
    title: "Independente e transparente",
    desc: "Não fazemos recomendações. Você decide com dados, não com palpite.",
  },
];

const personas = [
  { icon: ShoppingCart, name: "Roberto", role: "Importador", desc: "Compra insumos em dólar e precisa saber o melhor momento para fechar câmbio." },
  { icon: Briefcase, name: "Ricardo", role: "Gerente de Comex", desc: "Precisa justificar para a diretoria o timing das operações cambiais." },
  { icon: Code, name: "Juliana", role: "Desenvolvedora", desc: "Recebe em dólar e quer converter na melhor hora possível." },
  { icon: Store, name: "Luiz", role: "Franquias Internacionais", desc: "Paga royalties em euro e busca previsibilidade nos custos." },
];

const faqs = [
  { q: "A Treend faz recomendações de compra ou venda?", a: "Não. A Treend é uma ferramenta de consulta que ajuda você a entender o contexto do câmbio. A decisão final é sempre sua." },
  { q: "Como funciona o Score Treend?", a: "Nosso score analisa indicadores de mercado e posiciona o câmbio em uma escala de 1 a 100, indicando se a moeda está em zona de pressão ou de equilíbrio." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Não há fidelidade. Cancele quando quiser pelo painel da sua conta." },
  { q: "O trial é realmente gratuito?", a: "Sim, 7 dias de acesso completo sem compromisso. Não pedimos cartão de crédito." },
  { q: "Para quem a Treend é indicada?", a: "Para qualquer profissional que opera com dólar ou euro: importadores, exportadores, freelancers, gestores de comex e empresários." },
];

const pricingFeatures = [
  "Score diário USD e EUR",
  "Calculadora de timing",
  "Histórico de decisões",
  "Feed de notícias cambiais",
  "Comentários diários de especialistas",
];

const Index = () => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planKey: "monthly" | "annual") => {
    if (!user) {
      navigate("/register");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PLANS[planKey].priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
      else throw new Error("URL de checkout não retornada");
    } catch (err: any) {
      toast({ title: "Erro ao iniciar checkout", description: err.message, variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentProductId = subscription.productId;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={treendLogo} alt="Treend" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground leading-tight animate-fade-in-up">
            Saiba se o dólar está caro ou barato.{" "}
            <span className="text-primary">Decida com confiança.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            A Treend analisa o mercado e mostra o timing ideal para suas operações em dólar e euro, sem complicação.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/register">
              <Button size="lg" className="text-base px-8 py-6">
                Comece seu trial gratuito de 7 dias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
            Seu consultor cambial de bolso
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-4">
            Para quem é a Treend?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Profissionais que lidam com câmbio no dia a dia e querem tomar decisões melhores.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((p, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs text-primary font-medium mb-2">{p.role}</p>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
            Planos simples e acessíveis
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <PricingCard
              name="Mensal"
              price="R$49,90"
              period="mês"
              features={pricingFeatures}
              onSelect={() => handleCheckout("monthly")}
              isCurrentPlan={currentProductId === STRIPE_PLANS.monthly.productId}
              loading={loadingPlan === "monthly"}
            />
            <PricingCard
              name="Anual"
              price="R$299"
              period="ano"
              features={[...pricingFeatures, "Economia de 50% vs mensal"]}
              highlighted
              badge="Mais popular"
              onSelect={() => handleCheckout("annual")}
              isCurrentPlan={currentProductId === STRIPE_PLANS.annual.productId}
              loading={loadingPlan === "annual"}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-12">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={treendLogo} alt="Treend" className="h-5 w-auto" />
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Criar conta</Link>
              <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
            A Treend não é um produto financeiro e não faz recomendações de compra ou venda. 
            As informações apresentadas são de caráter consultivo e a decisão final é sempre do usuário. 
            Consulte um profissional antes de tomar decisões financeiras.
          </p>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Treend. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
