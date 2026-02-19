import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";
import loginMarketVideo from "@/assets/login-market-video.mp4";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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

          {sent ? (
            <>
              {/* Confirmation State */}
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
                E-mail enviado!
              </h1>
              <p className="text-muted-foreground mb-8">
                Verifique sua caixa de entrada para redefinir sua senha.
              </p>

              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle className="h-16 w-16 text-emerald-500 mb-6" />
                <p className="text-sm text-muted-foreground mb-8">
                  Enviamos um link de recuperação para{" "}
                  <strong className="text-foreground">{email}</strong>.
                  Caso não encontre, verifique a pasta de spam.
                </p>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 text-base font-semibold">
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Form State */}
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground mb-2">
                Recuperar senha
              </h1>
              <p className="text-muted-foreground mb-8">
                Informe seu e-mail cadastrado para receber o link de recuperação.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-muted/30 border-border/60"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar link de recuperação
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
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

export default ForgotPassword;
