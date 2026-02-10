import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Calendar } from "lucide-react";

const mockNews = [
  { id: 1, title: "Fed mantém juros e dólar recua frente ao real", summary: "Decisão do Federal Reserve manteve taxa entre 4,25% e 4,50%, gerando alívio nos mercados emergentes.", source: "Reuters", date: "2026-02-10", currency: "USD", url: "#" },
  { id: 2, title: "BCE sinaliza possível corte de juros em março", summary: "Banco Central Europeu indicou que condições econômicas podem justificar redução nas taxas de referência.", source: "Bloomberg", date: "2026-02-09", currency: "EUR", url: "#" },
  { id: 3, title: "Exportações brasileiras batem recorde em janeiro", summary: "Balança comercial favorável pressiona câmbio para baixo e favorece importadores.", source: "Valor Econômico", date: "2026-02-08", currency: "USD", url: "#" },
  { id: 4, title: "Euro se fortalece após dados positivos da Alemanha", summary: "PIB alemão superou expectativas e impulsionou a moeda europeia nos mercados globais.", source: "Financial Times", date: "2026-02-07", currency: "EUR", url: "#" },
  { id: 5, title: "Copom mantém Selic em 13,25% ao ano", summary: "Decisão unânime do comitê reforça atratividade do real frente a moedas estrangeiras.", source: "Banco Central", date: "2026-02-06", currency: "USD", url: "#" },
];

const NewsPage = () => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? mockNews : mockNews.filter((n) => n.currency === filter);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Notícias Cambiais</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">Geral</TabsTrigger>
          <TabsTrigger value="USD">Dólar</TabsTrigger>
          <TabsTrigger value="EUR">Euro</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filtered.map((news) => (
          <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer" className="block group">
            <Card className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {news.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{news.summary}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">{news.currency}</span>
                      <span className="text-xs text-muted-foreground">{news.source}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {news.date}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
