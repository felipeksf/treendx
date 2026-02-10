export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agenda_events: {
        Row: {
          admin_id: string
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          description: string | null
          event_date: string
          event_time: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string | null
          event_date: string
          event_time: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          admin_id: string
          comment_buy: string | null
          comment_sell: string | null
          created_at: string
          eur_score: number | null
          frequency: Database["public"]["Enums"]["score_frequency"]
          id: string
          rate_eur: number | null
          rate_usd: number | null
          score_date: string
          updated_at: string
          usd_score: number | null
          zone_eur: string | null
          zone_usd: string | null
        }
        Insert: {
          admin_id: string
          comment_buy?: string | null
          comment_sell?: string | null
          created_at?: string
          eur_score?: number | null
          frequency?: Database["public"]["Enums"]["score_frequency"]
          id?: string
          rate_eur?: number | null
          rate_usd?: number | null
          score_date?: string
          updated_at?: string
          usd_score?: number | null
          zone_eur?: string | null
          zone_usd?: string | null
        }
        Update: {
          admin_id?: string
          comment_buy?: string | null
          comment_sell?: string | null
          created_at?: string
          eur_score?: number | null
          frequency?: Database["public"]["Enums"]["score_frequency"]
          id?: string
          rate_eur?: number | null
          rate_usd?: number | null
          score_date?: string
          updated_at?: string
          usd_score?: number | null
          zone_eur?: string | null
          zone_usd?: string | null
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          admin_id: string
          body: string
          created_at: string
          currency: Database["public"]["Enums"]["currency_tag"]
          id: string
          image_url: string | null
          updated_at: string
        }
        Insert: {
          admin_id: string
          body: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_tag"]
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string
          body?: string
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_tag"]
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_decisions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          rate: number
          savings: number | null
          user_id: string
          zone: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          rate: number
          savings?: number | null
          user_id: string
          zone?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          rate?: number
          savings?: number | null
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      currency_tag: "USD" | "EUR" | "general"
      event_category: "mentoria" | "relatorio" | "macroeconomico"
      score_frequency: "weekly" | "biweekly" | "monthly"
      subscription_status: "trial" | "active" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      currency_tag: ["USD", "EUR", "general"],
      event_category: ["mentoria", "relatorio", "macroeconomico"],
      score_frequency: ["weekly", "biweekly", "monthly"],
      subscription_status: ["trial", "active", "expired"],
    },
  },
} as const
