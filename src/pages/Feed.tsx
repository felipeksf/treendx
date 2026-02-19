import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, BadgeCheck, Search, Pin, User, DollarSign, Euro, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
type CurrencyFilter = "all" | "USD" | "EUR" | "general";
const filters: {
  value: CurrencyFilter;
  label: string;
  icon: React.ElementType;
}[] = [{
  value: "all",
  label: "Tudo",
  icon: Globe
}, {
  value: "USD",
  label: "Dólar",
  icon: DollarSign
}, {
  value: "EUR",
  label: "Euro",
  icon: Euro
}];
interface FeedPost {
  id: string;
  admin_id: string;
  body: string;
  image_url: string | null;
  currency: "USD" | "EUR" | "general";
  created_at: string;
  like_count: number;
}
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }) + ", " + date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}
const FeedPage = () => {
  const {
    user
  } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("all");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const {
        data: postsData,
        error: postsError
      } = await supabase.from("feed_posts").select("*").order("created_at", {
        ascending: false
      });
      if (postsError) throw postsError;

      // Fetch like counts
      const postIds = (postsData || []).map((p) => p.id);
      let likeCounts: Record<string, number> = {};
      let userLikes: Set<string> = new Set();
      if (postIds.length > 0) {
        // Get counts
        const {
          data: likesData
        } = await supabase.from("feed_likes").select("post_id").in("post_id", postIds);
        if (likesData) {
          for (const like of likesData) {
            likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
          }
        }

        // Get user's likes
        if (user) {
          const {
            data: userLikesData
          } = await supabase.from("feed_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds);
          if (userLikesData) {
            userLikes = new Set(userLikesData.map((l) => l.post_id));
          }
        }
      }
      const enriched: FeedPost[] = (postsData || []).map((p) => ({
        id: p.id,
        admin_id: p.admin_id,
        body: p.body,
        image_url: p.image_url,
        currency: p.currency,
        created_at: p.created_at,
        like_count: likeCounts[p.id] || 0
      }));
      setPosts(enriched);
      setLikedPosts(userLikes);
    } catch (e) {
      console.error("Error fetching feed:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPosts();
  }, []);
  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);

    // Optimistic update
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);else next.add(postId);
      return next;
    });
    setPosts((prev) => prev.map((p) => p.id === postId ? {
      ...p,
      like_count: p.like_count + (isLiked ? -1 : 1)
    } : p));
    try {
      if (isLiked) {
        await supabase.from("feed_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("feed_likes").insert({
          post_id: postId,
          user_id: user.id
        });
      }
    } catch (e) {
      // Revert on error
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(postId);else next.delete(postId);
        return next;
      });
      setPosts((prev) => prev.map((p) => p.id === postId ? {
        ...p,
        like_count: p.like_count + (isLiked ? 1 : -1)
      } : p));
    }
  };
  const filtered = posts.filter((p) => currencyFilter === "all" || p.currency === currencyFilter).filter((p) => !searchQuery.trim() || p.body.toLowerCase().includes(searchQuery.toLowerCase()));

  // First post is always "pinned"
  const pinnedPost = filtered.length > 0 ? filtered[0] : null;
  const restPosts = filtered.slice(1);
  return <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports Semanais

      </h1>
        <p className="text-sm text-muted-foreground">Compartilhamos cases semanais de atuaç

      </p>
      </div>

      {/* Currency Filters */}
      

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar posts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 bg-muted/50 border-border/40 text-sm" />
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
            <span className="text-sm text-muted-foreground">
              No que você está pensando, {displayName}?
            </span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="space-y-4">
          {Array.from({
        length: 3
      }).map((_, i) => <div key={i} className="rounded-2xl bg-card border border-border/40 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            </div>)}
        </div>}

      {/* Empty state */}
      {!loading && filtered.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhuma publicação encontrada.
        </div>}

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post, idx) => {
        const liked = likedPosts.has(post.id);
        const isPinned = idx === 0;
        return <div key={post.id} className="rounded-2xl bg-card border border-border/40 overflow-hidden">
              {/* Pinned label */}
              {isPinned && <div className="flex items-center gap-1.5 px-5 py-2 bg-primary/10 border-b border-primary/10">
                  <Pin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Post Fixado
                  </span>
                </div>}

              <div className="p-5 space-y-4">
                {/* Author header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                      TA
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      Treend A.
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.created_at)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground bg-primary px-2 py-0.5 rounded-md">
                      Admin
                    </span>
                  </div>
                </div>

                {/* Body */}
                <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                  {post.body}
                </p>

                {/* Image */}
                {post.image_url && <div className="rounded-xl overflow-hidden">
                    <img src={post.image_url} alt="" className="w-full h-auto object-cover max-h-80" loading="lazy" />
                  </div>}

                {/* Actions */}
                <div className="flex items-center pt-2">
                  <button className={cn("flex items-center gap-1.5 text-sm transition-colors", liked ? "text-red-500" : "text-muted-foreground hover:text-red-400")} onClick={() => toggleLike(post.id)}>
                    <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                    <span className="text-xs font-medium">
                      {post.like_count}
                    </span>
                  </button>
                </div>
              </div>
            </div>;
      })}
      </div>
    </div>;
};
export default FeedPage;