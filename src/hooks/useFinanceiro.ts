import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { isTabelaAusente } from '@/hooks/useEstoque'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sbFin = supabase as any

export const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'Transferência']
export type Situacao = 'pendente' | 'parcial' | 'pago' | 'isento'
export const SITUACAO_LABEL: Record<Situacao, string> = { pendente: 'Pendente', parcial: 'Parcial', pago: 'Pago', isento: 'Isento' }

// Tipos de serviço que não entram no controle financeiro (vêm da contratante).
export const TIPOS_NAO_COBRADOS = ['leitura']
const normTipo = (t: string | null | undefined) =>
  (t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const TIPOS_IGNORADOS = new Set(TIPOS_NAO_COBRADOS.flatMap((t) => [normTipo(t), `${normTipo(t)}s`, `${normTipo(t)}es`]))
export const tipoNaoCobrado = (t: string | null | undefined) => TIPOS_IGNORADOS.has(normTipo(t))

export const fmtBRL = (n: number) => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export interface Recebimento {
  id: string; servico_id: string; data_pagamento: string; valor: number; forma_pagamento: string
  observacao: string | null; criado_por: string | null; estornado_em: string | null; motivo_estorno: string | null; created_at: string
}

export interface ContaOS {
  id: string; protocolo: string; uf: string; condominio: string; unidade: string; morador: string
  tipo: string; tecnico: string; dataExecucao: string | null; valor: number; recebido: number; saldo: number
  formaInformada: string | null; situacao: Situacao; isento: boolean; motivoIsencao: string | null
}

export function useFinanceiroInstalado() {
  return useQuery({
    queryKey: ['financeiro', 'instalacao'],
    staleTime: 60_000,
    queryFn: async () => {
      const [a, b] = await Promise.all([
        sbFin.from('financeiro_recebimentos').select('id').limit(1),
        sbFin.from('financeiro_situacao_os').select('servico_id').limit(1),
      ])
      if (isTabelaAusente(a.error) || isTabelaAusente(b.error)) return false
      if (a.error) throw a.error
      if (b.error) throw b.error
      return true
    },
  })
}

const STATUS_FECHADO = ['executado', 'concluido']

async function buscarTodos<T>(build: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>) {
  const out: T[] = []
  for (let i = 0; ; i += 1000) {
    const { data, error } = await build(i, i + 999)
    if (error) throw error
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

export function useFinanceiroDados(enabled: boolean) {
  return useQuery({
    queryKey: ['financeiro', 'dados'],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const [servicos, recebs, sits, ops] = await Promise.all([
        buscarTodos<any>((f, t) => sbFin.from('servicos_nacional_gas')
          .select('id, numero_protocolo, uf, condominio_nome_original, bloco, apartamento, morador_nome, tipo_servico, tecnico_id, valor_servico, forma_pagamento, updated_at, status_atendimento')
          .in('status_atendimento', STATUS_FECHADO).order('updated_at', { ascending: false }).range(f, t)),
        buscarTodos<Recebimento>((f, t) => sbFin.from('financeiro_recebimentos').select('*').order('data_pagamento', { ascending: false }).range(f, t)),
        buscarTodos<any>((f, t) => sbFin.from('financeiro_situacao_os').select('*').range(f, t)),
        sbFin.from('operadores').select('id, nome').then((r: any) => r.data ?? []),
      ])
      const ids = servicos.map((s) => s.id)
      const execMap = new Map<string, string>()
      for (let i = 0; i < ids.length; i += 200) {
        const { data } = await sbFin.from('servicos_nacional_gas_historico').select('servico_id, valor_novo, created_at')
          .eq('campo_alterado', 'status_atendimento').in('valor_novo', STATUS_FECHADO).in('servico_id', ids.slice(i, i + 200))
        for (const h of data ?? []) {
          const at = execMap.get(h.servico_id)
          if (!at || h.created_at > at) execMap.set(h.servico_id, h.created_at)
        }
      }
      const opMap = new Map<string, string>((ops as any[]).map((o) => [o.id, o.nome]))
      const sitMap = new Map<string, any>(sits.map((s) => [s.servico_id, s]))
      const recMap = new Map<string, number>()
      for (const r of recebs) if (!r.estornado_em) recMap.set(r.servico_id, (recMap.get(r.servico_id) ?? 0) + Number(r.valor))

      const contas: ContaOS[] = servicos.map((s) => {
        const valor = Number(s.valor_servico) || 0
        const recebido = recMap.get(s.id) ?? 0
        const sit = sitMap.get(s.id)
        const isento = !!sit?.isento
        const situacao: Situacao = isento ? 'isento' : recebido <= 0 ? 'pendente' : recebido + 0.009 < valor ? 'parcial' : 'pago'
        return {
          id: s.id, protocolo: s.numero_protocolo ?? '', uf: s.uf ?? '', condominio: s.condominio_nome_original ?? '',
          unidade: [s.bloco && `Bl ${s.bloco}`, s.apartamento && `Ap ${s.apartamento}`].filter(Boolean).join(' '),
          morador: s.morador_nome ?? '', tipo: s.tipo_servico ?? '', tecnico: opMap.get(s.tecnico_id) ?? '',
          dataExecucao: execMap.get(s.id) ?? s.updated_at, valor, recebido,
          saldo: isento ? 0 : Math.max(0, valor - recebido), formaInformada: s.forma_pagamento ?? null,
          situacao, isento, motivoIsencao: sit?.motivo_isencao ?? null,
        }
      })
      const contaMap = new Map(contas.map((c) => [c.id, c]))
      return { contas, recebimentos: recebs, contaMap }
    },
  })
}

export function useInvalidarFinanceiro() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['financeiro'] })
}
