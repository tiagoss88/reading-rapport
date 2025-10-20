import { z } from 'zod'

// CPF validation regex (11 digits)
const cpfRegex = /^\d{11}$/

// CNPJ validation regex (14 digits)
const cnpjRegex = /^\d{14}$/

// Cliente validation schema
export const clienteSchema = z.object({
  nome: z.string().max(255, 'Nome muito longo').optional().or(z.literal('')),
  cpf: z.string().regex(cpfRegex, 'CPF deve conter 11 dígitos').optional().or(z.literal('')),
  identificacao_unidade: z.string().min(1, 'Identificação da unidade é obrigatória').max(100, 'Identificação muito longa'),
  empreendimento_id: z.string().uuid('ID de empreendimento inválido'),
  leitura_inicial: z.number().min(0, 'Leitura inicial não pode ser negativa'),
  status: z.enum(['ativo', 'inativo', 'bloqueado'], { errorMap: () => ({ message: 'Status inválido' }) })
})

// Operador validation schema
export const operadorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(72, 'Senha muito longa').optional(),
  status: z.enum(['ativo', 'inativo'], { errorMap: () => ({ message: 'Status inválido' }) })
})

// Empreendimento validation schema
export const empreendimentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(500, 'Endereço muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  cnpj: z.string().regex(cnpjRegex, 'CNPJ deve conter 14 dígitos').optional().or(z.literal('')),
  observacoes: z.string().max(1000, 'Observações muito longas').optional().or(z.literal('')),
  tipo_gas: z.string().optional().or(z.literal('')),
  fator_conversao: z.number().min(0, 'Fator de conversão não pode ser negativo').optional(),
  preco_kg_gas: z.number().min(0, 'Preço não pode ser negativo').optional(),
  preco_m3_gas: z.number().min(0, 'Preço não pode ser negativo').optional()
})

// Servico validation schema
export const servicoSchema = z.object({
  tipo_servico: z.string().min(1, 'Tipo de serviço é obrigatório').max(100, 'Tipo de serviço inválido'),
  empreendimento_id: z.string().uuid('ID de empreendimento inválido'),
  cliente_id: z.string().uuid('ID de cliente inválido'),
  data_agendamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
  observacoes: z.string().max(1000, 'Observações muito longas').optional().or(z.literal(''))
})
