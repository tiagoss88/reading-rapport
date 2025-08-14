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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          cpf: string | null
          created_at: string
          empreendimento_id: string
          id: string
          identificacao_unidade: string
          nome: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          empreendimento_id: string
          id?: string
          identificacao_unidade: string
          nome?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          empreendimento_id?: string
          id?: string
          identificacao_unidade?: string
          nome?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimento_users: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimento_users_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: true
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimentos: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string
          fator_conversao: number | null
          id: string
          nome: string
          observacoes: string | null
          preco_kg_gas: number | null
          preco_m3_gas: number | null
          tipo_gas: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco: string
          fator_conversao?: number | null
          id?: string
          nome: string
          observacoes?: string | null
          preco_kg_gas?: number | null
          preco_m3_gas?: number | null
          tipo_gas?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string
          fator_conversao?: number | null
          id?: string
          nome?: string
          observacoes?: string | null
          preco_kg_gas?: number | null
          preco_m3_gas?: number | null
          tipo_gas?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leituras: {
        Row: {
          cliente_id: string
          created_at: string
          data_leitura: string
          foto_url: string | null
          id: string
          leitura_atual: number
          observacao: string | null
          operador_id: string
          status_sincronizacao: string
          tipo_observacao: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_leitura?: string
          foto_url?: string | null
          id?: string
          leitura_atual: number
          observacao?: string | null
          operador_id: string
          status_sincronizacao?: string
          tipo_observacao?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_leitura?: string
          foto_url?: string | null
          id?: string
          leitura_atual?: number
          observacao?: string | null
          operador_id?: string
          status_sincronizacao?: string
          tipo_observacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leituras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores"
            referencedColumns: ["id"]
          },
        ]
      }
      operadores: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          cliente_id: string
          created_at: string
          data_agendamento: string
          empreendimento_id: string
          hora_agendamento: string
          id: string
          observacoes: string | null
          operador_responsavel_id: string | null
          status: string
          tipo_servico: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_agendamento: string
          empreendimento_id: string
          hora_agendamento: string
          id?: string
          observacoes?: string | null
          operador_responsavel_id?: string | null
          status?: string
          tipo_servico: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_agendamento?: string
          empreendimento_id?: string
          hora_agendamento?: string
          id?: string
          observacoes?: string | null
          operador_responsavel_id?: string | null
          status?: string
          tipo_servico?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_operador_responsavel_id_fkey"
            columns: ["operador_responsavel_id"]
            isOneToOne: false
            referencedRelation: "operadores"
            referencedColumns: ["id"]
          },
        ]
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
