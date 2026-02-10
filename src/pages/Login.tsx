import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({ title: "Erro ao entrar com Google", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
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
            Entre na sua conta
          </h1>
          <p className="text-muted-foreground mb-8">
            Bem-vindo de volta! Selecione o método de login.
          </p>

          {/* Social Login */}
          <div className="flex gap-3 mb-6">
            <Button
              variant="outline"
              className="flex-1 h-12 border-border/60 hover:bg-accent/50"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <Separator className="bg-border/60" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              ou continue com e-mail
            </span>
          </div>

          {/* Form */}
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

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 bg-muted/30 border-border/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Lembrar-me
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Esqueci a senha
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        {/* Background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-foreground/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary-foreground/5" />
        </div>

        {/* Floating icons */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Central hub icon */}
          <div className="relative">
            {/* Connection lines */}
            <svg className="absolute -inset-20 w-[calc(100%+10rem)] h-[calc(100%+10rem)]" viewBox="0 0 200 200">
              <line x1="100" y1="100" x2="40" y2="40" stroke="hsl(var(--primary-foreground))" strokeWidth="1" opacity="0.3" />
              <line x1="100" y1="100" x2="160" y2="50" stroke="hsl(var(--primary-foreground))" strokeWidth="1" opacity="0.3" />
              <line x1="100" y1="100" x2="50" y2="160" stroke="hsl(var(--primary-foreground))" strokeWidth="1" opacity="0.3" />
            </svg>

            {/* Central icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
              <img src={treendLogo} alt="" className="h-10 w-auto" />
            </div>

            {/* Orbiting icons */}
            <div className="absolute -top-16 -left-12 w-12 h-12 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>

            <div className="absolute -top-8 right-[-4rem] w-12 h-12 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
              <svg className="h-5 w-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>

            <div className="absolute bottom-[-4rem] -left-8 w-12 h-12 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
              <svg className="h-5 w-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="mt-24 text-center">
            <h2 className="text-2xl font-bold text-primary-foreground font-display tracking-tight">
              Currency Intelligence
            </h2>
            <p className="mt-2 text-primary-foreground/70 text-sm max-w-xs">
              Tudo que você precisa para tomar as melhores decisões cambiais em um só lugar.
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            <div className="w-2 h-2 rounded-full bg-primary-foreground/30" />
            <div className="w-2 h-2 rounded-full bg-primary-foreground/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
