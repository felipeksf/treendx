import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2, Image as ImageIcon, BadgeCheck } from "lucide-react";

interface FeedPost {
  id: number;
  body: string;
  currency: string;
  createdAt: string;
}

const initialPosts: FeedPost[] = [
  { id: 1, body: "Fed mantém juros e dólar recua frente ao real. A decisão do Federal Reserve manteve a taxa entre 4,25% e 4,50%.", currency: "USD", createdAt: "2026-02-10T10:30:00Z" },
  { id: 2, body: "BCE sinaliza possível corte de juros em março. O euro pode perder força nas próximas semanas.", currency: "EUR", createdAt: "2026-02-09T15:00:00Z" },
  { id: 3, body: "Copom mantém Selic em 13,25% ao ano. Isso pode significar que o dólar continue em zonas mais baixas.", currency: "USD", createdAt: "2026-02-06T18:00:00Z" },
];

const AdminFeed = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [newText, setNewText] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handlePost = () => {
    if (!newText.trim()) return;
    const post: FeedPost = {
      id: Date.now(),
      body: newText.trim(),
      currency,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [post, ...prev]);
    setNewText("");
    toast({ title: "Publicação criada com sucesso!" });
  };

  const handleDelete = (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Publicação removida." });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        Gestão do Feed
      </h1>

      {/* Composer */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Nova publicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">TA</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">Treend Admin</span>
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Textarea
            placeholder="Escreva uma análise para o feed..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="resize-none bg-muted/50 border-border min-h-[100px]"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                <ImageIcon className="h-4 w-4" /> Imagem
              </Button>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Moeda:</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-8 w-24 text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dólar</SelectItem>
                    <SelectItem value="EUR">Euro</SelectItem>
                    <SelectItem value="general">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" onClick={handlePost} disabled={!newText.trim()} className="gap-1.5">
              <Send className="h-4 w-4" /> Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Posts */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Publicações anteriores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhuma publicação.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {post.currency === "general" ? "Geral" : post.currency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 line-clamp-2">{post.body}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(post.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeed;
