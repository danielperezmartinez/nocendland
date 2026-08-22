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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      nutrition_ingredient: {
        Row: {
          calories_per_100: number | null
          carbohydrates_per_100: number | null
          description: string | null
          fats_per_100: number | null
          grams_per_unit: number | null
          id: number
          id_user: string
          image_route: string | null
          name: string
          proteins_per_100: number | null
        }
        Insert: {
          calories_per_100?: number | null
          carbohydrates_per_100?: number | null
          description?: string | null
          fats_per_100?: number | null
          grams_per_unit?: number | null
          id?: number
          id_user: string
          image_route?: string | null
          name: string
          proteins_per_100?: number | null
        }
        Update: {
          calories_per_100?: number | null
          carbohydrates_per_100?: number | null
          description?: string | null
          fats_per_100?: number | null
          grams_per_unit?: number | null
          id?: number
          id_user?: string
          image_route?: string | null
          name?: string
          proteins_per_100?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_ingredient_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_intake: {
        Row: {
          date: string
          id: number
          id_user: string
          ingredient: number
          quantity_in_grams: number | null
          units: number | null
        }
        Insert: {
          date?: string
          id?: number
          id_user: string
          ingredient: number
          quantity_in_grams?: number | null
          units?: number | null
        }
        Update: {
          date?: string
          id?: number
          id_user?: string
          ingredient?: number
          quantity_in_grams?: number | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_intake_id_user_foreign"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_intake_ingredient_fkey"
            columns: ["ingredient"]
            isOneToOne: false
            referencedRelation: "nutrition_ingredient"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_objective: {
        Row: {
          calories: number
          carbohydrates: number
          fats: number
          id_user: string
          level: Database["public"]["Enums"]["nutrition_objetive_levels"]
          proteins: number
        }
        Insert: {
          calories?: number
          carbohydrates?: number
          fats?: number
          id_user: string
          level: Database["public"]["Enums"]["nutrition_objetive_levels"]
          proteins?: number
        }
        Update: {
          calories?: number
          carbohydrates?: number
          fats?: number
          id_user?: string
          level?: Database["public"]["Enums"]["nutrition_objetive_levels"]
          proteins?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_objective_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_objetive_level: {
        Row: {
          id: number
          id_user: string
          level: Database["public"]["Enums"]["nutrition_objetive_levels"]
        }
        Insert: {
          id?: number
          id_user: string
          level?: Database["public"]["Enums"]["nutrition_objetive_levels"]
        }
        Update: {
          id?: number
          id_user?: string
          level?: Database["public"]["Enums"]["nutrition_objetive_levels"]
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_objetive_level_id_user_foreign"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      training_entry: {
        Row: {
          created_at: string
          exercise_id: number
          id: number
          id_user: string
          performed_on: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_id: number
          id?: number
          id_user: string
          performed_on?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_id?: number
          id?: number
          id_user?: string
          performed_on?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_entry_exercise_owner_fkey"
            columns: ["exercise_id", "id_user"]
            isOneToOne: false
            referencedRelation: "training_exercise"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "training_entry_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      training_exercise: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: number
          id_user: string
          image_path: string | null
          movement_patterns: string[]
          muscle_groups: string[]
          name: string
          portable_id: string
          tips: string[]
          training_modalities: string[]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: number
          id_user: string
          image_path?: string | null
          movement_patterns?: string[]
          muscle_groups?: string[]
          name: string
          portable_id?: string
          tips?: string[]
          training_modalities?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: number
          id_user?: string
          image_path?: string | null
          movement_patterns?: string[]
          muscle_groups?: string[]
          name?: string
          portable_id?: string
          tips?: string[]
          training_modalities?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_exercise_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      training_schedule: {
        Row: {
          created_at: string
          id: number
          id_user: string
          is_active: boolean
          name: string
          portable_id: string
          source_share_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_user: string
          is_active?: boolean
          name: string
          portable_id?: string
          source_share_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          id_user?: string
          is_active?: boolean
          name?: string
          portable_id?: string
          source_share_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_schedule_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_schedule_source_share_id_fkey"
            columns: ["source_share_id"]
            isOneToOne: false
            referencedRelation: "training_share"
            referencedColumns: ["id"]
          },
        ]
      }
      training_schedule_item: {
        Row: {
          created_at: string
          exercise_id: number
          id: number
          id_user: string
          schedule_id: number
          set_count: number
          sort_order: number
          target_repetitions: number | null
          target_weight_kg: number | null
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          exercise_id: number
          id?: number
          id_user: string
          schedule_id: number
          set_count?: number
          sort_order?: number
          target_repetitions?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          exercise_id?: number
          id?: number
          id_user?: string
          schedule_id?: number
          set_count?: number
          sort_order?: number
          target_repetitions?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_schedule_item_exercise_owner_fkey"
            columns: ["exercise_id", "id_user"]
            isOneToOne: false
            referencedRelation: "training_exercise"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "training_schedule_item_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_schedule_item_schedule_owner_fkey"
            columns: ["schedule_id", "id_user"]
            isOneToOne: false
            referencedRelation: "training_schedule"
            referencedColumns: ["id", "id_user"]
          },
        ]
      }
      training_set: {
        Row: {
          created_at: string
          entry_id: number
          id: number
          id_user: string
          position: number
          repetitions: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          entry_id: number
          id?: number
          id_user: string
          position: number
          repetitions?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          entry_id?: number
          id?: number
          id_user?: string
          position?: number
          repetitions?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_set_entry_owner_fkey"
            columns: ["entry_id", "id_user"]
            isOneToOne: false
            referencedRelation: "training_entry"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "training_set_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      training_share: {
        Row: {
          created_at: string
          id: string
          manifest: Json
          owner_id: string
          revoked_at: string | null
          share_type: string
          title: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          manifest: Json
          owner_id: string
          revoked_at?: string | null
          share_type: string
          title: string
          token_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          manifest?: Json
          owner_id?: string
          revoked_at?: string | null
          share_type?: string
          title?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_share_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          avatar_url: string
          created_at: string
          email: string
          id: string
          user_name: string
        }
        Insert: {
          avatar_url: string
          created_at?: string
          email: string
          id?: string
          user_name: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          email?: string
          id?: string
          user_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      nutrition_intake_with_totals: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          date: string | null
          fats: number | null
          id_user: string | null
          ingredient: number | null
          ingredient_name: string | null
          intake_id: number | null
          proteins: number | null
          quantity_in_grams: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_intake_id_user_foreign"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_intake_ingredient_fkey"
            columns: ["ingredient"]
            isOneToOne: false
            referencedRelation: "nutrition_ingredient"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_objectives_totals: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          date: string | null
          fats: number | null
          id_user: string | null
          proteins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_intake_id_user_foreign"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_training_schedule: {
        Args: { target_schedule_id: number }
        Returns: undefined
      }
      ensure_training_schedule: {
        Args: never
        Returns: {
          created_at: string
          id: number
          id_user: string
          is_active: boolean
          name: string
          portable_id: string
          source_share_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "training_schedule"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      import_training_share_manifest: {
        Args: {
          activate_schedule?: boolean
          conflict_actions?: Json
          shared_manifest: Json
          source_share?: string
        }
        Returns: Json
      }
      save_training_schedule_catalog: {
        Args: { catalog_draft: Json; selected_key: string }
        Returns: Json
      }
    }
    Enums: {
      nutrition_objetive_levels: "keep" | "good" | "top"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      nutrition_objetive_levels: ["keep", "good", "top"],
    },
  },
} as const
