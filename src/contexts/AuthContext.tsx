import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  subscription: SubscriptionState;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  subscription: { subscribed: false, productId: null, subscriptionEnd: null, isLoading: true },
  signOut: async () => {},
  checkSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Stripe product/price mapping
export const STRIPE_PLANS = {
  monthly: {
    priceId: "price_1SzMoKFCE1ecOeleuxhrSHsu",
    productId: "prod_TxHNTJQcxyyyep",
    name: "Mensal",
    price: "R$49,90",
    period: "mês",
  },
  annual: {
    priceId: "price_1SzMobFCE1ecOeleYtgjspEe",
    productId: "prod_TxHNgzgF3Se6gI",
    name: "Anual",
    price: "R$299",
    period: "ano",
  },
} as const;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription({
        subscribed: data?.subscribed ?? false,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
        isLoading: false,
      });
    } catch {
      setSubscription((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Block Google OAuth users that are not previously registered
        if (event === "SIGNED_IN" && session?.user) {
          const provider = session.user.app_metadata?.provider;
          if (provider === "google") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("user_id", session.user.id)
              .maybeSingle();
            if (!profile) {
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setIsAdmin(false);
              setSubscription({ subscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
              setIsLoading(false);
              alert("Você precisa se cadastrar primeiro para acessar a plataforma.");
              return;
            }
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkAdminRole(session.user.id), 0);
          setTimeout(() => checkSubscription(), 0);
        } else {
          setIsAdmin(false);
          setSubscription({ subscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        checkSubscription();
      } else {
        setSubscription((s) => ({ ...s, isLoading: false }));
      }
      setIsLoading(false);
    });

    return () => authSub.unsubscribe();
  }, [checkSubscription]);

  // Refresh subscription every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSubscription({ subscribed: false, productId: null, subscriptionEnd: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, isLoading, subscription, signOut, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};
