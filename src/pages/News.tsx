import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, BadgeCheck, Send, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  author: string;
  avatar: string;
  body: string;
  image?: string;
  currency: "USD" | "EUR" | "general";
  createdAt: string;
  likes: number;
}

const mockPosts: Post[] = [
  {
    id: 1,
    author: "Treend Admin",
    avatar: "",
    body: "Fed mantém juros e dólar recua frente ao real. A decisão do Federal Reserve manteve a taxa entre 4,25% e 4,50%, gerando alívio nos mercados emergentes. Para importadores, esse é um momento de atenção: a zona está se aproximando de 'Favorável' para compra.",
    currency: "USD",
    createdAt: "2026-02-10T10:30:00Z",
    likes: 24,
  },
  {
    id: 2,
    author: "Treend Admin",
    avatar: "",
    body: "BCE sinaliza possível corte de juros em março. O Banco Central Europeu indicou que as condições econômicas podem justificar uma redução nas taxas de referência. O euro pode perder força nas próximas semanas — fique atento ao Score Treend para EUR.",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
    currency: "EUR",
    createdAt: "2026-02-09T15:00:00Z",
    likes: 18,
  },
  {
    id: 3,
    author: "Treend Admin",
    avatar: "",
    body: "Exportações brasileiras batem recorde em janeiro! A balança comercial favorável pressiona o câmbio para baixo e favorece importadores. Se você opera com dólar, o cenário atual é de atenção para quem quer comprar.",
    currency: "USD",
    createdAt: "2026-02-08T09:15:00Z",
    likes: 31,
  },
  {
    id: 4,
    author: "Treend Admin",
    avatar: "",
    body: "Euro se fortalece após dados positivos da Alemanha. O PIB alemão superou expectativas e impulsionou a moeda europeia nos mercados globais. Para exportadores que vendem em euro, a zona está se tornando mais favorável.",
    currency: "EUR",
    createdAt: "2026-02-07T14:45:00Z",
    likes: 12,
  },
  {
    id: 5,
    author: "Treend Admin",
    avatar: "",
    body: "Copom mantém Selic em 13,25% ao ano. A decisão unânime do comitê reforça a atratividade do real frente a moedas estrangeiras. Isso pode significar que o dólar continue em zonas mais baixas nos próximos dias. Acompanhe o Score diário para tomar a melhor decisão.",
    currency: "USD",
    createdAt: "2026-02-06T18:00:00Z",
    likes: 45,
  },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} hora${diffH > 1 ? "s" : ""}`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD} dia${diffD > 1 ? "s" : ""}`;
}

const NewsPage = () => {
  const [filter, setFilter] = useState("all");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
    () => Object.fromEntries(mockPosts.map((p) => [p.id, p.likes]))
  );
  const [newPostText, setNewPostText] = useState("");

  // TODO: replace with real auth role check
  const isAdmin = false;

  const filtered =
    filter === "all"
      ? mockPosts
      : mockPosts.filter((p) => p.currency === filter);

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setLikeCounts((c) => ({ ...c, [id]: (c[id] ?? 0) - 1 }));
      } else {
        next.add(id);
        setLikeCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
      }
      return next;
    });
  };

  const handlePost = () => {
    if (!newPostText.trim()) return;
    // TODO: send to backend (news_feed table)
    setNewPostText("");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground">Feed</h1>

      {/* Admin composer */}
      {isAdmin && (
        <Card className="bg-card border-border">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">TA</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">Nova publicação</span>
            </div>
            <Textarea
              placeholder="Escreva uma análise para o feed..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="resize-none bg-muted/50 border-border min-h-[80px]"
            />
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                <ImageIcon className="h-4 w-4" /> Imagem
              </Button>
              <Button size="sm" onClick={handlePost} disabled={!newPostText.trim()} className="gap-1.5">
                <Send className="h-4 w-4" /> Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-muted">
          <TabsTrigger value="all">Tudo</TabsTrigger>
          <TabsTrigger value="USD">Dólar</TabsTrigger>
          <TabsTrigger value="EUR">Euro</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => {
          const liked = likedPosts.has(post.id);
          return (
            <Card key={post.id} className="bg-card border-border overflow-hidden">
              <CardContent className="py-5 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">TA</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">{post.author}</span>
                      <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {post.currency === "general" ? "Geral" : post.currency}
                  </span>
                </div>

                {/* Body */}
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{post.body}</p>

                {/* Image */}
                {post.image && (
                  <div className="rounded-lg overflow-hidden -mx-1">
                    <img src={post.image} alt="" className="w-full h-auto object-cover max-h-80" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center pt-1 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-1.5 text-muted-foreground", liked && "text-red-500")}
                    onClick={() => toggleLike(post.id)}
                  >
                    <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                    <span className="text-xs">{likeCounts[post.id] ?? 0}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default NewsPage;
