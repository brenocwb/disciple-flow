export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      discipulos: {
        Row: {
          contato: string | null
          created_at: string
          data_inicio_discipulado: string | null
          dificuldades_areas_crescimento: string | null
          dons_talentos: string | null
          id: string
          last_contact_at: string | null
          lider_id: string
          maturidade_espiritual: string
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          contato?: string | null
          created_at?: string
          data_inicio_discipulado?: string | null
          dificuldades_areas_crescimento?: string | null
          dons_talentos?: string | null
          id?: string
          last_contact_at?: string | null
          lider_id: string
          maturidade_espiritual?: string
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          contato?: string | null
          created_at?: string
          data_inicio_discipulado?: string | null
          dificuldades_areas_crescimento?: string | null
          dons_talentos?: string | null
          id?: string
          last_contact_at?: string | null
          lider_id?: string
          maturidade_espiritual?: string
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      encontros: {
        Row: {
          created_at: string
          data_encontro: string
          discipulo_id: string
          id: string
          lider_id: string
          notas_discussao: string | null
          proximos_passos: string | null
          topico: string | null
        }
        Insert: {
          created_at?: string
          data_encontro: string
          discipulo_id: string
          id?: string
          lider_id: string
          notas_discussao?: string | null
          proximos_passos?: string | null
          topico?: string | null
        }
        Update: {
          created_at?: string
          data_encontro?: string
          discipulo_id?: string
          id?: string
          lider_id?: string
          notas_discussao?: string | null
          proximos_passos?: string | null
          topico?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encontros_discipulo_id_fkey"
            columns: ["discipulo_id"]
            isOneToOne: false
            referencedRelation: "discipulos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_oracao: {
        Row: {
          categoria: string | null
          created_at: string
          data_conclusao: string | null
          data_pedido: string
          discipulo_id: string | null
          id: string
          lider_id: string
          pedido: string
          status: string
          testemunho: string | null
          updated_at: string
          urgencia: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_pedido?: string
          discipulo_id?: string | null
          id?: string
          lider_id: string
          pedido: string
          status?: string
          testemunho?: string | null
          updated_at?: string
          urgencia?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_conclusao?: string | null
          data_pedido?: string
          discipulo_id?: string | null
          id?: string
          lider_id?: string
          pedido?: string
          status?: string
          testemunho?: string | null
          updated_at?: string
          urgencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_oracao_discipulo_id_fkey"
            columns: ["discipulo_id"]
            isOneToOne: false
            referencedRelation: "discipulos"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          tipo_lider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          tipo_lider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          tipo_lider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
