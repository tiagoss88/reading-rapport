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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          empreendimento_id: string
          endereco: string | null
          estado: string | null
          id: string
          identificacao_unidade: string
          latitude: number | null
          leitura_inicial: number
          longitude: number | null
          nome: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          empreendimento_id: string
          endereco?: string | null
          estado?: string | null
          id?: string
          identificacao_unidade: string
          latitude?: number | null
          leitura_inicial?: number
          longitude?: number | null
          nome?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          empreendimento_id?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          identificacao_unidade?: string
          latitude?: number | null
          leitura_inicial?: number
          longitude?: number | null
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
          latitude: number | null
          longitude: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          latitude?: number | null
          longitude?: number | null
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
      operador_localizacoes: {
        Row: {
          bateria_nivel: number | null
          created_at: string | null
          em_movimento: boolean | null
          endereco_estimado: string | null
          fonte_localizacao: string | null
          id: string
          latitude: number
          longitude: number
          operador_id: string
          precisao: number | null
          precisao_rating: string | null
          tentativas_gps: number | null
          timestamp: string
          velocidade: number | null
        }
        Insert: {
          bateria_nivel?: number | null
          created_at?: string | null
          em_movimento?: boolean | null
          endereco_estimado?: string | null
          fonte_localizacao?: string | null
          id?: string
          latitude: number
          longitude: number
          operador_id: string
          precisao?: number | null
          precisao_rating?: string | null
          tentativas_gps?: number | null
          timestamp?: string
          velocidade?: number | null
        }
        Update: {
          bateria_nivel?: number | null
          created_at?: string | null
          em_movimento?: boolean | null
          endereco_estimado?: string | null
          fonte_localizacao?: string | null
          id?: string
          latitude?: number
          longitude?: number
          operador_id?: string
          precisao?: number | null
          precisao_rating?: string | null
          tentativas_gps?: number | null
          timestamp?: string
          velocidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operador_localizacoes_operador_id_fkey"
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
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: Database["public"]["Enums"]["app_permission"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["app_permission"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["app_permission"]
        }
        Relationships: []
      }
      servicos: {
        Row: {
          cliente_id: string
          created_at: string
          data_agendamento: string
          data_execucao: string | null
          descricao_servico_realizado: string | null
          empreendimento_id: string
          fotos_servico: string[] | null
          hora_agendamento: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          materiais_utilizados: string | null
          observacoes: string | null
          observacoes_execucao: string | null
          operador_responsavel_id: string | null
          status: string
          tipo_servico: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_agendamento: string
          data_execucao?: string | null
          descricao_servico_realizado?: string | null
          empreendimento_id: string
          fotos_servico?: string[] | null
          hora_agendamento?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          materiais_utilizados?: string | null
          observacoes?: string | null
          observacoes_execucao?: string | null
          operador_responsavel_id?: string | null
          status?: string
          tipo_servico: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_agendamento?: string
          data_execucao?: string | null
          descricao_servico_realizado?: string | null
          empreendimento_id?: string
          fotos_servico?: string[] | null
          hora_agendamento?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          materiais_utilizados?: string | null
          observacoes?: string | null
          observacoes_execucao?: string | null
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
      servicos_externos: {
        Row: {
          created_at: string
          data_agendamento: string
          data_execucao: string | null
          descricao_servico_realizado: string | null
          endereco_servico: string
          fotos_servico: string[] | null
          hora_agendamento: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          materiais_utilizados: string | null
          nome_cliente: string
          observacoes: string | null
          observacoes_execucao: string | null
          operador_responsavel_id: string | null
          status: string
          telefone_cliente: string
          tipo_servico: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_agendamento: string
          data_execucao?: string | null
          descricao_servico_realizado?: string | null
          endereco_servico: string
          fotos_servico?: string[] | null
          hora_agendamento?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          materiais_utilizados?: string | null
          nome_cliente: string
          observacoes?: string | null
          observacoes_execucao?: string | null
          operador_responsavel_id?: string | null
          status?: string
          telefone_cliente: string
          tipo_servico: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_agendamento?: string
          data_execucao?: string | null
          descricao_servico_realizado?: string | null
          endereco_servico?: string
          fotos_servico?: string[] | null
          hora_agendamento?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          materiais_utilizados?: string | null
          nome_cliente?: string
          observacoes?: string | null
          observacoes_execucao?: string | null
          operador_responsavel_id?: string | null
          status?: string
          telefone_cliente?: string
          tipo_servico?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      operadores_ultima_localizacao: {
        Row: {
          bateria_nivel: number | null
          em_movimento: boolean | null
          id: string | null
          latitude: number | null
          longitude: number | null
          operador_email: string | null
          operador_id: string | null
          operador_nome: string | null
          operador_status: string | null
          precisao: number | null
          segundos_desde_atualizacao: number | null
          timestamp: string | null
          velocidade: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operador_localizacoes_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_role_permissions: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      get_public_empreendimentos: {
        Args: Record<PropertyKey, never>
        Returns: {
          endereco: string
          id: string
          latitude: number
          longitude: number
          nome: string
        }[]
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_permission:
        | "view_dashboard"
        | "manage_empreendimentos"
        | "manage_clientes"
        | "view_leituras"
        | "create_leituras"
        | "manage_operadores"
        | "create_servicos"
        | "manage_agendamentos"
        | "coletor_leituras"
        | "coletor_servicos"
        | "view_agendamentos"
        | "create_servicos_externos"
        | "view_rastreamento_operadores"
      app_role:
        | "admin"
        | "gestor_empreendimento"
        | "operador_completo"
        | "operador_leitura"
        | "operador_servicos"
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
      app_permission: [
        "view_dashboard",
        "manage_empreendimentos",
        "manage_clientes",
        "view_leituras",
        "create_leituras",
        "manage_operadores",
        "create_servicos",
        "manage_agendamentos",
        "coletor_leituras",
        "coletor_servicos",
        "view_agendamentos",
        "create_servicos_externos",
        "view_rastreamento_operadores",
      ],
      app_role: [
        "admin",
        "gestor_empreendimento",
        "operador_completo",
        "operador_leitura",
        "operador_servicos",
      ],
    },
  },
} as const
