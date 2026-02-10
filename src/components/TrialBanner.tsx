import { Clock } from "lucide-react";

interface TrialBannerProps {
  daysLeft: number;
}

const TrialBanner = ({ daysLeft }: TrialBannerProps) => {
  if (daysLeft <= 0) return null;
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3 mb-4">
      <Clock className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm text-foreground">
        <span className="font-semibold">Trial ativo:</span> Você tem{" "}
        <span className="text-primary font-bold">{daysLeft} dias</span> restantes de acesso completo.
      </p>
    </div>
  );
};

export default TrialBanner;
