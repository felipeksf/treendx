import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, BadgeCheck, Send, Image as ImageIcon, Search, Pin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Post {
  id: number;
  author: string;
  avatar: string;
  body: string;
  image?: string;
  currency: "USD" | "EUR" | "general";
  createdAt: string;
  likes: number;
  pinned?: boolean;
}

const mockPosts: Post[] = [
  {
    id: 1,
    author: "Treend Admin",
    avatar: "",
    body: "🎉 Bem-vindo ao Treend!\n\nA plataforma de inteligência cambial que te ajuda a decidir o melhor momento para comprar ou vender moeda estrangeira.\n\n💡 O que você encontra aqui?\n\n✅ Score diário para USD e EUR\n✅ Calculadora de economia potencial\n✅ Agenda de eventos macroeconômicos\n✅ Histórico completo de decisões\n✅ Tutoriais e análises exclusivas\n\n🧠 Dica: Acompanhe o Score Treend diariamente e tome decisões com mais confiança.\n\nSeja muito bem-vindo(a). Bora otimizar seu câmbio! 🚀",
    currency: "general",
    createdAt: "2026-02-10T10:30:00Z",
    likes: 24,
    pinned: true,
  },
  {
    id: 2,
    author: "Treend Admin",
    avatar: "",
    body: "Fed mantém juros e dólar recua frente ao real. A decisão do Federal Reserve manteve a taxa entre 4,25% e 4,50%, gerando alívio nos mercados emergentes. Para importadores, esse é um momento de atenção: a zona está se aproximando de 'Favorável' para compra.",
    currency: "USD",
    createdAt: "2026-02-09T15:00:00Z",
    likes: 18,
  },
  {
    id: 3,
    author: "Treend Admin",
    avatar: "",
    body: "BCE sinaliza possível corte de juros em março. O Banco Central Europeu indicou que as condições econômicas podem justificar uma redução nas taxas de referência. O euro pode perder força nas próximas semanas — fique atento ao Score Treend para EUR.",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop",
    currency: "EUR",
    createdAt: "2026-02-08T09:15:00Z",
    likes: 31,
  },
  {
    id: 4,
    author: "Treend Admin",
    avatar: "",
    body: "Exportações brasileiras batem recorde em janeiro! A balança comercial favorável pressiona o câmbio para baixo e favorece importadores. Se você opera com dólar, o cenário atual é de atenção para quem quer comprar.",
    currency: "USD",
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + ", " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const NewsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
    () => Object.fromEntries(mockPosts.map((p) => [p.id, p.likes]))
  );

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";

  const filtered = searchQuery.trim()
    ? mockPosts.filter((p) => p.body.toLowerCase().includes(searchQuery.toLowerCase()))
    : mockPosts;

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

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Feed da Comunidade</h1>
        <p className="text-sm text-muted-foreground">Compartilhe ideias e descubra análises cambiais</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border/40 text-sm"
          />
        </div>
        <Button size="sm" className="h-9 px-4 text-sm">
          Buscar
        </Button>
      </div>

      {/* Composer placeholder */}
      <div className="rounded-2xl bg-card border border-border/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 rounded-xl bg-muted/50 border border-border/30 px-4 py-2.5">
            <span className="text-sm text-muted-foreground">No que você está pensando, {displayName}?</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => {
          const liked = likedPosts.has(post.id);
          return (
            <div key={post.id} className="rounded-2xl bg-card border border-border/40 overflow-hidden">
              {/* Pinned label */}
              {post.pinned && (
                <div className="flex items-center gap-1.5 px-5 py-2 bg-primary/10 border-b border-primary/10">
                  <Pin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Post Fixado</span>
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Author header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">TA</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{post.author.split(" ")[0]} {post.author.split(" ")[1]?.charAt(0)}.</span>
                    <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground bg-primary px-2 py-0.5 rounded-md">
                      Admin
                    </span>
                  </div>
                </div>

                {/* Body */}
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{post.body}</p>

                {/* Image */}
                {post.image && (
                  <div className="rounded-xl overflow-hidden">
                    <img src={post.image} alt="" className="w-full h-auto object-cover max-h-80" loading="lazy" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center pt-2">
                  <button
                    className={cn(
                      "flex items-center gap-1.5 text-sm transition-colors",
                      liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                    )}
                    onClick={() => toggleLike(post.id)}
                  >
                    <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                    <span className="text-xs font-medium">{likeCounts[post.id] ?? 0}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NewsPage;
