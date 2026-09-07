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
    PostgrestVersion: "14.5"
  }
  nocendland: {
    Tables: {
      finance_budget_allocation: {
        Row: {
          category_id: number
          created_at: string
          id: number
          id_user: string
          notes: string | null
          period_id: number
          planned_amount: number
          updated_at: string
        }
        Insert: {
          category_id: number
          created_at?: string
          id?: number
          id_user: string
          notes?: string | null
          period_id: number
          planned_amount?: number
          updated_at?: string
        }
        Update: {
          category_id?: number
          created_at?: string
          id?: number
          id_user?: string
          notes?: string | null
          period_id?: number
          planned_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budget_allocation_category_owner_fkey"
            columns: ["category_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_category"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "finance_budget_allocation_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_allocation_period_owner_fkey"
            columns: ["period_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_period"
            referencedColumns: ["id", "id_user"]
          },
        ]
      }
      finance_category: {
        Row: {
          archived_at: string | null
          created_at: string
          flow_type: string
          id: number
          id_user: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          flow_type: string
          id?: number
          id_user: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          flow_type?: string
          id?: number
          id_user?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_category_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_goal: {
        Row: {
          created_at: string
          id: number
          id_user: string
          initial_amount: number
          name: string
          notes: string | null
          status: string
          target_amount: number
          target_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_user: string
          initial_amount?: number
          name: string
          notes?: string | null
          status?: string
          target_amount: number
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          id_user?: string
          initial_amount?: number
          name?: string
          notes?: string | null
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_goal_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_movement: {
        Row: {
          amount: number
          category_id: number
          created_at: string
          goal_id: number | null
          id: number
          id_user: string
          name: string
          notes: string | null
          occurred_on: string | null
          period_id: number
          recurrence_due_on: string | null
          recurring_item_id: number | null
          scheduled_on: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: number
          created_at?: string
          goal_id?: number | null
          id?: number
          id_user: string
          name: string
          notes?: string | null
          occurred_on?: string | null
          period_id: number
          recurrence_due_on?: string | null
          recurring_item_id?: number | null
          scheduled_on: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: number
          created_at?: string
          goal_id?: number | null
          id?: number
          id_user?: string
          name?: string
          notes?: string | null
          occurred_on?: string | null
          period_id?: number
          recurrence_due_on?: string | null
          recurring_item_id?: number | null
          scheduled_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_movement_category_owner_fkey"
            columns: ["category_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_category"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "finance_movement_goal_owner_fkey"
            columns: ["goal_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_goal"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "finance_movement_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_movement_period_owner_fkey"
            columns: ["period_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_period"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "finance_movement_recurring_item_owner_fkey"
            columns: ["recurring_item_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_recurring_item"
            referencedColumns: ["id", "id_user"]
          },
        ]
      }
      finance_period: {
        Row: {
          closed_at: string | null
          created_at: string
          ends_on: string
          id: number
          id_user: string
          opening_balance: number
          starts_on: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          ends_on: string
          id?: number
          id_user: string
          opening_balance?: number
          starts_on: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          ends_on?: string
          id?: number
          id_user?: string
          opening_balance?: number
          starts_on?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_period_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_recurring_item: {
        Row: {
          amount: number
          archived_at: string | null
          category_id: number
          created_at: string
          due_day: number
          ends_on: string | null
          goal_id: number | null
          id: number
          id_user: string
          interval_months: number
          name: string
          notes: string | null
          starts_on: string
          updated_at: string
        }
        Insert: {
          amount: number
          archived_at?: string | null
          category_id: number
          created_at?: string
          due_day: number
          ends_on?: string | null
          goal_id?: number | null
          id?: number
          id_user: string
          interval_months?: number
          name: string
          notes?: string | null
          starts_on: string
          updated_at?: string
        }
        Update: {
          amount?: number
          archived_at?: string | null
          category_id?: number
          created_at?: string
          due_day?: number
          ends_on?: string | null
          goal_id?: number | null
          id?: number
          id_user?: string
          interval_months?: number
          name?: string
          notes?: string | null
          starts_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_recurring_item_category_owner_fkey"
            columns: ["category_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_category"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "finance_recurring_item_goal_owner_fkey"
            columns: ["goal_id", "id_user"]
            isOneToOne: false
            referencedRelation: "finance_goal"
            referencedColumns: ["id", "id_user"]
          },
          {
            foreignKeyName: "finance_recurring_item_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_settings: {
        Row: {
          created_at: string
          currency_code: string
          id_user: string
          period_start_day: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          id_user: string
          period_start_day?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          id_user?: string
          period_start_day?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_settings_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
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
          level: Database["nocendland"]["Enums"]["nutrition_objetive_levels"]
          proteins: number
        }
        Insert: {
          calories?: number
          carbohydrates?: number
          fats?: number
          id_user: string
          level: Database["nocendland"]["Enums"]["nutrition_objetive_levels"]
          proteins?: number
        }
        Update: {
          calories?: number
          carbohydrates?: number
          fats?: number
          id_user?: string
          level?: Database["nocendland"]["Enums"]["nutrition_objetive_levels"]
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
          level: Database["nocendland"]["Enums"]["nutrition_objetive_levels"]
        }
        Insert: {
          id?: number
          id_user: string
          level?: Database["nocendland"]["Enums"]["nutrition_objetive_levels"]
        }
        Update: {
          id?: number
          id_user?: string
          level?: Database["nocendland"]["Enums"]["nutrition_objetive_levels"]
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
      ensure_finance_period: {
        Args: { target_date?: string }
        Returns: {
          closed_at: string | null
          created_at: string
          ends_on: string
          id: number
          id_user: string
          opening_balance: number
          starts_on: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "finance_period"
          isOneToOne: true
          isSetofReturn: false
        }
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
      materialize_finance_period: {
        Args: { target_period_id: number }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  nocendland: {
    Enums: {
      nutrition_objetive_levels: ["keep", "good", "top"],
    },
  },
} as const
