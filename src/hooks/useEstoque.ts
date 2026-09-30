import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export type EstadoInstalacao = 'verificando' | 'instalado' | 'nao_instalado' | 'erro'

export interface MaterialSaldo {
  id: string
  nome: string
  descricao: string | null
  unidade: string
  categoria: string | null
  estoque_minimo: number
  ativo: boolean
  saldo: number
}

export interface Movimentacao {
  id: string
  material_id: string
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  motivo: string | null
  observacao: string | null
  servico_id: string | null
  created_at: string
  material_nome?: string
  material_unidade?: string
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
  return erro.code === 'PGRST205' || erro.code === '42P01' || /could not find the table/i.test(erro.message ?? '')
}

export function useEstoqueInstalacao() {
  const q = useQuery({
    queryKey: ['estoque', 'instalacao'],
    queryFn: async (): Promise<EstadoInstalacao> => {
      const checks = await Promise.all([
        supabase.from('materiais').select('id').limit(1),
        supabase.from('estoque_movimentacoes').select('id').limit(1),
        supabase.from('tipo_servico_materiais').select('id').limit(1),
        supabase.from('v_estoque_saldo').select('material_id').limit(1),
      ])
      if (checks.some((c) => isTabelaAusente(c.error))) return 'nao_instalado'
      const outro = checks.find((c) => c.error)
      if (outro?.error) throw outro.error
      return 'instalado'
    },
    retry: false,
    staleTime: 60_000,
  })
  const estado: EstadoInstalacao = q.isLoading ? 'verificando' : q.isError ? 'erro' : (q.data ?? 'verificando')
  return { estado, erro: q.error as Error | null, recarregar: q.refetch }
}

export function useMateriaisSaldo(enabled: boolean) {
  return useQuery({
    queryKey: ['estoque', 'materiais'],
    enabled,
    queryFn: async (): Promise<MaterialSaldo[]> => {
      const [mats, saldos] = await Promise.all([
        supabase.from('materiais').select('*').order('nome'),
        supabase.from('v_estoque_saldo').select('material_id, saldo'),
      ])
      if (mats.error) throw mats.error
      if (saldos.error) throw saldos.error
      const mapa = new Map((saldos.data ?? []).map((s) => [s.material_id, Number(s.saldo ?? 0)]))
      return (mats.data ?? []).map((m) => ({
        ...m,
        estoque_minimo: Number(m.estoque_minimo ?? 0),
        saldo: mapa.get(m.id) ?? 0,
      }))
    },
  })
}

export function useMovimentacoes(enabled: boolean, filtros: { inicio: string; fim: string }) {
  return useQuery({
    queryKey: ['estoque', 'movimentacoes', filtros],
    enabled,
    queryFn: async (): Promise<Movimentacao[]> => {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select('id, material_id, tipo, quantidade, motivo, observacao, servico_id, created_at')
        .gte('created_at', `${filtros.inicio}T00:00:00-03:00`)
        .lte('created_at', `${filtros.fim}T23:59:59-03:00`)
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) throw error
      const movs = (data ?? []) as Movimentacao[]

      const idsMat = [...new Set(movs.map((m) => m.material_id))]
      const idsServ = [...new Set(movs.map((m) => m.servico_id).filter(Boolean) as string[])]
      const [mats, servs] = await Promise.all([
        idsMat.length
          ? supabase.from('materiais').select('id, nome, unidade').in('id', idsMat)
          : Promise.resolve({ data: [] as { id: string; nome: string; unidade: string }[], error: null }),
        idsServ.length
          ? supabase.from('servicos_nacional_gas').select('id, numero_protocolo').in('id', idsServ)
          : Promise.resolve({ data: [] as { id: string; numero_protocolo: string | null }[], error: null }),
      ])
      const mapaMat = new Map((mats.data ?? []).map((m) => [m.id, m]))
      const mapaServ = new Map((servs.data ?? []).map((s) => [s.id, s.numero_protocolo]))
      return movs.map((m) => ({
        ...m,
        quantidade: Number(m.quantidade),
        material_nome: mapaMat.get(m.material_id)?.nome ?? '—',
        material_unidade: mapaMat.get(m.material_id)?.unidade ?? '',
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
