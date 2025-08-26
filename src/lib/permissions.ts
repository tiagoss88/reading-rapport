// Utility functions for managing permissions in the app
export const ROLE_PERMISSIONS = {
  admin: [
    'view_dashboard',
    'manage_empreendimentos', 
    'manage_clientes',
    'view_leituras',
    'create_leituras',
    'manage_operadores',
    'create_servicos',
    'manage_agendamentos',
    'coletor_leituras',
    'coletor_servicos',
    'view_agendamentos'
  ],
  gestor_empreendimento: [
    'view_dashboard',
    'manage_clientes',
    'view_leituras',
    'create_servicos',
    'manage_agendamentos',
    'view_agendamentos'
  ],
  operador_completo: [
    'coletor_leituras',
    'coletor_servicos',
    'view_leituras',
    'view_agendamentos'
  ],
  operador_leitura: [
    'coletor_leituras',
    'view_leituras'
  ],
  operador_servicos: [
    'coletor_servicos',
    'view_agendamentos'
  ]
} as const

export const PERMISSION_LABELS = {
  view_dashboard: 'Ver Dashboard',
  manage_empreendimentos: 'Gerenciar Empreendimentos',
  manage_clientes: 'Gerenciar Clientes',
  view_leituras: 'Ver Leituras',
  create_leituras: 'Criar Leituras',
  manage_operadores: 'Gerenciar Operadores',
  create_servicos: 'Criar Serviços',
  manage_agendamentos: 'Gerenciar Agendamentos',
  coletor_leituras: 'Coletor de Leituras',
  coletor_servicos: 'Coletor de Serviços',
  view_agendamentos: 'Ver Agendamentos'
} as const

export const ROLE_LABELS = {
  admin: 'Administrador',
  gestor_empreendimento: 'Gestor de Empreendimento',
  operador_completo: 'Operador Completo',
  operador_leitura: 'Operador de Leitura',
  operador_servicos: 'Operador de Serviços'
} as const