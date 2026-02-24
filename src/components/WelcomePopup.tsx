import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlayCircle, ArrowRight } from "lucide-react";
import treendLogo from "@/assets/treend-logo.png";

const STORAGE_KEY = "treend_welcome_seen";

const WelcomePopup = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const goToTutorials = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    navigate("/tutorials");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-2xl">
            <img src={treendLogo} alt="Treend" className="h-30 w-30 object-contain" />
          </div>
          <DialogTitle className="text-xl">Bem-vindo à Treend! 🎉</DialogTitle>
          <DialogDescription className="text-sm mt-2 leading-relaxed">
            Para aproveitar ao máximo a plataforma, recomendamos que você assista às nossas aulas introdutórias na seção de <strong>Tutoriais</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-border bg-secondary/30 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <PlayCircle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Tutoriais</p>
            <p className="text-[11px] text-muted-foreground">Vídeos curtos para dominar cada recurso</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <Button onClick={goToTutorials} className="w-full gap-2">
            <PlayCircle className="h-4 w-4" />
            Assistir tutoriais
          </Button>
          <Button variant="ghost" onClick={dismiss} className="w-full text-xs text-muted-foreground">
            Explorar por conta própria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
