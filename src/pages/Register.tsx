import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { Loader2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";
import loginMarketVideo from "@/assets/login-market-video.mp4";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PLANS } from "@/contexts/AuthContext";

type PlanKey = "monthly" | "annual";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("monthly");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Send welcome email (fire-and-forget)
    supabase.functions.invoke("send-welcome-email", {
      body: { email, name },
    }).catch((err) => console.error("Welcome email error:", err));

    // Redirect to Stripe Checkout with selected plan
    try {
      const { data, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PLANS[selectedPlan].priceId },
      });

      if (checkoutError || !data?.url) {
        throw new Error(checkoutError?.message || "Erro ao criar checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout redirect error:", err);
      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para escolher seu plano...",
      });
      navigate("/pricing");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <Link to="/" className="inline-block mb-4 -my-4">
            <img src={treendLogo} alt="Treend" className="h-32 w-auto" />
          </Link>

          {/* Title */}
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
            Criar conta
          </h1>
          <p className="text-muted-foreground mb-6">
            Comece seu trial gratuito de 7 dias. Sem cobrança agora.
          </p>

          {/* Plan Selector */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedPlan("monthly")}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <div className="text-sm font-semibold text-foreground">Mensal</div>
              <div className="text-lg font-bold text-primary">R$49,90<span className="text-xs font-normal text-muted-foreground">/mês</span></div>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan("annual")}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all relative ${
                selectedPlan === "annual"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <span className="absolute -top-2.5 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                -50%
              </span>
              <div className="text-sm font-semibold text-foreground">Anual</div>
              <div className="text-lg font-bold text-primary">R$299<span className="text-xs font-normal text-muted-foreground">/ano</span></div>
            </button>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className="pl-10 h-12 bg-muted/30 border-border/60" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-12 bg-muted/30 border-border/60" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10 pr-10 h-12 bg-muted/30 border-border/60" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirm" type={showConfirmPassword ? "text" : "password"} placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10 pr-10 h-12 bg-muted/30 border-border/60" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(v === true)} />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                Li e aceito os termos de uso e a política de privacidade da Treend.
              </label>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={!terms || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta e iniciar trial
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              7 dias grátis • Cancele quando quiser
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
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

export default Register;
