import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  onSelect?: () => void;
  isCurrentPlan?: boolean;
  loading?: boolean;
}

const PricingCard = ({ name, price, period, features, highlighted, badge, onSelect, isCurrentPlan, loading }: PricingCardProps) => {
  return (
    <Card className={`relative flex flex-col ${highlighted ? "border-primary card-glow" : "border-border"} ${isCurrentPlan ? "ring-2 ring-treend-success" : ""}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {badge}
          </span>
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-treend-success text-white text-xs">Seu Plano</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg font-display">{name}</CardTitle>
        <div className="mt-2">
          <span className="text-4xl font-bold font-display text-foreground">{price}</span>
          <span className="text-muted-foreground text-sm ml-1">/{period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-3 flex-1 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-treend-success mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          onClick={onSelect}
          disabled={isCurrentPlan || loading}
          className={highlighted ? "w-full" : "w-full bg-secondary text-secondary-foreground hover:bg-secondary/80"}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
          ) : isCurrentPlan ? (
            "Plano atual"
          ) : (
            "Assinar agora"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
