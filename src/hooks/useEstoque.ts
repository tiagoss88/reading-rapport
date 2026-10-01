import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

// Tabelas de armazéns ainda não constam nos tipos gerados (instaladas por script manual)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sbEstoque = supabase as any

export type EstadoInstalacao = 'verificando' | 'instalado' | 'nao_instalado' | 'atualizacao_pendente' | 'erro'

export interface Armazem {
  id: string
  nome: string
  uf: string | null
  ativo: boolean
}

export interface MaterialSaldo {
  id: string
  nome: string
  descricao: string | null
  unidade: string
  categoria: string | null
  estoque_minimo: number
  ativo: boolean
  saldo: number
  porArmazem: Record<string, number>
}

export interface Movimentacao {
  id: string
  material_id: string
  armazem_id: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  motivo: string | null
  observacao: string | null
  servico_id: string | null
  transferencia_id: string | null
  created_at: string
  material_nome?: string
  material_unidade?: string
  armazem_nome?: string
  protocolo?: string | null
}

export interface Receita {
  id: string
  tipo_servico: string
  material_id: string
  quantidade: number
}

/** Tabela ausente no banco (PostgREST) ou relação inexistente (Postgres) */
export function isTabelaAusente(erro: { code?: string; message?: string } | null | undefined) {
  if (!erro) return false
  return erro.code === 'PGRST205' || erro.code === '42P01' || erro.code === '42703' || erro.code === 'PGRST204' ||
    /could not find the table|does not exist/i.test(erro.message ?? '')
}

export function useEstoqueInstalacao() {
  const q = useQuery({
    queryKey: ['estoque', 'instalacao'],
    queryFn: async (): Promise<EstadoInstalacao> => {
      const checks = await Promise.all([
        supabase.from('materiais').select('id').limit(1),
        supabase.from('estoque_movimentacoes').select('id').limit(1),
        supabase.from('tipo_servico_materiais').select('id').limit(1),
        sbEstoque.from('v_estoque_saldo').select('material_id').limit(1),
      ])
      if (checks.some((c) => isTabelaAusente(c.error))) return 'nao_instalado'
      const outro = checks.find((c) => c.error)
      if (outro?.error) throw outro.error
      const arm = await Promise.all([
        sbEstoque.from('armazens').select('id').limit(1),
        sbEstoque.from('v_estoque_saldo_armazem').select('material_id').limit(1),
        sbEstoque.from('estoque_movimentacoes').select('armazem_id').limit(1),
      ])
      if (arm.some((c: { error: { code?: string; message?: string } | null }) => isTabelaAusente(c.error))) return 'atualizacao_pendente'
      const e2 = arm.find((c: { error: unknown }) => c.error)
      if (e2?.error) throw e2.error
      const rpc = await sbEstoque.rpc('listar_materiais_os', { p_servico_id: '00000000-0000-0000-0000-000000000000' })
      if (rpc.error && (rpc.error.code === 'PGRST202' || rpc.error.code === '42883' || /function/i.test(rpc.error.message ?? ''))) return 'atualizacao_pendente'
      return 'instalado'
    },
    retry: false,
    staleTime: 60_000,
  })
  const estado: EstadoInstalacao = q.isLoading ? 'verificando' : q.isError ? 'erro' : (q.data ?? 'verificando')
  return { estado, erro: q.error as Error | null, recarregar: q.refetch }
}

export function useArmazens(enabled = true) {
  return useQuery({
    queryKey: ['estoque', 'armazens'],
    enabled,
    queryFn: async (): Promise<Armazem[]> => {
      const { data, error } = await sbEstoque.from('armazens').select('id, nome, uf, ativo').order('nome')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useMateriaisSaldo(enabled: boolean) {
  return useQuery({
    queryKey: ['estoque', 'materiais'],
    enabled,
    queryFn: async (): Promise<MaterialSaldo[]> => {
      const [mats, saldos] = await Promise.all([
        supabase.from('materiais').select('*').order('nome'),
        sbEstoque.from('v_estoque_saldo_armazem').select('material_id, armazem_id, saldo'),
      ])
      if (mats.error) throw mats.error
      if (saldos.error) throw saldos.error
      const mapa = new Map<string, Record<string, number>>()
      for (const s of (saldos.data ?? []) as { material_id: string; armazem_id: string; saldo: number }[]) {
        const r = mapa.get(s.material_id) ?? {}
        r[s.armazem_id] = Number(s.saldo ?? 0)
        mapa.set(s.material_id, r)
      }
      return (mats.data ?? []).map((m) => {
        const porArmazem = mapa.get(m.id) ?? {}
        return {
          ...m,
          estoque_minimo: Number(m.estoque_minimo ?? 0),
          porArmazem,
          saldo: Object.values(porArmazem).reduce((a, b) => a + b, 0),
        }
      })
    },
  })
}

export function useMovimentacoes(enabled: boolean, filtros: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['estoque', 'movimentacoes', filtros],
    enabled,
    queryFn: async (): Promise<Movimentacao[]> => {
      const { data, error } = await sbEstoque
        .from('estoque_movimentacoes')
        .select('id, material_id, armazem_id, tipo, quantidade, motivo, observacao, servico_id, transferencia_id, created_at')
        .gte('created_at', `${filtros.inicio}T00:00:00-03:00`)
        .lte('created_at', `${filtros.fim}T23:59:59-03:00`)
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) throw error
      const movs = (data ?? []) as Movimentacao[]

      const idsMat = [...new Set(movs.map((m) => m.material_id))]
      const idsServ = [...new Set(movs.map((m) => m.servico_id).filter(Boolean) as string[])]
      const [mats, servs, arms] = await Promise.all([
        idsMat.length
          ? supabase.from('materiais').select('id, nome, unidade').in('id', idsMat)
          : Promise.resolve({ data: [] as { id: string; nome: string; unidade: string }[], error: null }),
        idsServ.length
          ? supabase.from('servicos_nacional_gas').select('id, numero_protocolo').in('id', idsServ)
          : Promise.resolve({ data: [] as { id: string; numero_protocolo: string | null }[], error: null }),
        sbEstoque.from('armazens').select('id, nome'),
      ])
      const mapaMat = new Map((mats.data ?? []).map((m) => [m.id, m]))
      const mapaServ = new Map((servs.data ?? []).map((s) => [s.id, s.numero_protocolo]))
      const mapaArm = new Map(((arms.data ?? []) as { id: string; nome: string }[]).map((a) => [a.id, a.nome]))
      return movs.map((m) => ({
        ...m,
        quantidade: Number(m.quantidade),
        material_nome: mapaMat.get(m.material_id)?.nome ?? '—',
        material_unidade: mapaMat.get(m.material_id)?.unidade ?? '',
        armazem_nome: mapaArm.get(m.armazem_id) ?? '—',
        protocolo: m.servico_id ? mapaServ.get(m.servico_id) ?? null : null,
      }))
    },
  })
}

export function useReceitas(enabled: boolean) {
  return useQuery({
    queryKey: ['estoque', 'receitas'],
    enabled,
    queryFn: async (): Promise<Receita[]> => {
      const { data, error } = await supabase
        .from('tipo_servico_materiais')
        .select('id, tipo_servico, material_id, quantidade')
        .order('tipo_servico')
      if (error) throw error
      return (data ?? []).map((r) => ({ ...r, quantidade: Number(r.quantidade) }))
    },
  })
}

export function useTiposServicoNomes(enabled: boolean) {
  return useQuery({
    queryKey: ['estoque', 'tipos-servico'],
    enabled,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('tipos_servico').select('nome, status').order('nome')
      if (error) throw error
      return [...new Set((data ?? []).filter((t) => t.status !== 'inativo').map((t) => t.nome))]
    },
  })
}

export const fmtQtd = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
