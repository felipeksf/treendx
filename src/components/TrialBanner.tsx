import { Clock, AlertTriangle } from "lucide-react";

interface TrialBannerProps {
  daysLeft: number;
}

const TrialBanner = ({ daysLeft }: TrialBannerProps) => {
  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 2;
  const Icon = isUrgent ? AlertTriangle : Clock;

  return (
    <div
      className={`rounded-lg px-4 py-3 flex items-center gap-3 mb-4 border ${
        isUrgent
          ? "bg-destructive/10 border-destructive/20"
          : "bg-primary/10 border-primary/20"
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${isUrgent ? "text-destructive" : "text-primary"}`} />
      <p className="text-sm text-foreground">
        <span className="font-semibold">{isUrgent ? "Trial expirando!" : "Trial ativo:"}</span>{" "}
        Você tem{" "}
        <span className={`font-bold ${isUrgent ? "text-destructive" : "text-primary"}`}>
          {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
        </span>{" "}
        restantes de acesso completo.
      </p>
    </div>
  );
};

export default TrialBanner;
