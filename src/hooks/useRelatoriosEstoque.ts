import { supabase } from '@/integrations/supabase/client'
import { sbEstoque } from '@/hooks/useEstoque'

export type TipoRelEstoque = 'saldo' | 'movimentacoes' | 'consumo'
export type AgrupConsumo = 'tipo' | 'tecnico' | 'os'

export interface FiltrosEstoque {
  inicio: string
  fim: string
  armazemId: string // '' = todos
  categoria: string
  somenteAtivos: boolean
  materialId: string
  tipoMov: string
  tipoServico: string
  tecnicoId: string
  agrupamento: AgrupConsumo
}

export interface Relatorio {
  colunas: string[]
  linhas: (string | number)[][]
  rodape?: (string | number)[][]
}

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
const dtHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

async function armazens() {
  const { data, error } = await sbEstoque.from('armazens').select('id, nome, uf').order('nome')
  if (error) throw error
  return (data ?? []) as { id: string; nome: string; uf: string | null }[]
}

export async function gerarSaldo(f: FiltrosEstoque): Promise<Relatorio> {
  const [arms, mats, saldos] = await Promise.all([
    armazens(),
    supabase.from('materiais').select('id, nome, unidade, categoria, estoque_minimo, ativo').order('nome'),
    sbEstoque.from('v_estoque_saldo_armazem').select('material_id, armazem_id, saldo'),
  ])
  if (mats.error) throw mats.error
  if (saldos.error) throw saldos.error
  const usados = f.armazemId ? arms.filter((a) => a.id === f.armazemId) : arms
  const mapa = new Map<string, number>()
  for (const s of (saldos.data ?? []) as { material_id: string; armazem_id: string; saldo: number }[])
    mapa.set(`${s.material_id}|${s.armazem_id}`, Number(s.saldo ?? 0))
  const linhas: (string | number)[][] = []
  let abaixo = 0
  for (const m of mats.data ?? []) {
    if (f.somenteAtivos && !m.ativo) continue
    if (f.categoria && (m.categoria ?? '') !== f.categoria) continue
    const vals = usados.map((a) => mapa.get(`${m.id}|${a.id}`) ?? 0)
    const total = vals.reduce((x, y) => x + y, 0)
    const min = Number(m.estoque_minimo ?? 0)
    const baixo = min > 0 && (usados.length > 1 ? vals.some((v) => v < min) : total < min)
    if (baixo) abaixo++
    linhas.push([m.nome, m.categoria ?? '—', m.unidade, ...vals.map(fmt), fmt(total), fmt(min), baixo ? 'Abaixo do mínimo' : 'OK'])
  }
  return {
    colunas: ['Material', 'Categoria', 'Unid.', ...usados.map((a) => a.nome), 'Total', 'Mínimo', 'Situação'],
    linhas,
    rodape: [[`${linhas.length} materiais`, `${abaixo} abaixo do mínimo`]],
  }
}

export async function gerarMovimentacoes(f: FiltrosEstoque): Promise<Relatorio> {
  let q = sbEstoque
    .from('estoque_movimentacoes')
    .select('id, material_id, armazem_id, tipo, quantidade, motivo, observacao, servico_id, transferencia_id, created_at')
    .gte('created_at', `${f.inicio}T00:00:00-03:00`)
    .lte('created_at', `${f.fim}T23:59:59-03:00`)
    .order('created_at', { ascending: false })
    .limit(10000)
  if (f.armazemId) q = q.eq('armazem_id', f.armazemId)
  if (f.materialId) q = q.eq('material_id', f.materialId)
  const { data, error } = await q
  if (error) throw error
  let movs = (data ?? []) as {
    material_id: string; armazem_id: string; tipo: string; quantidade: number; motivo: string | null
    observacao: string | null; servico_id: string | null; transferencia_id: string | null; created_at: string
  }[]
  const tipoDe = (m: (typeof movs)[number]) => (m.transferencia_id ? 'transferencia' : m.tipo)
  if (f.tipoMov) movs = movs.filter((m) => tipoDe(m) === f.tipoMov)
  const idsMat = [...new Set(movs.map((m) => m.material_id))]
  const idsServ = [...new Set(movs.map((m) => m.servico_id).filter(Boolean) as string[])]
  const [arms, mats, servs] = await Promise.all([
    armazens(),
    idsMat.length ? supabase.from('materiais').select('id, nome, unidade').in('id', idsMat) : Promise.resolve({ data: [] as { id: string; nome: string; unidade: string }[] }),
    idsServ.length ? supabase.from('servicos_nacional_gas').select('id, numero_protocolo').in('id', idsServ) : Promise.resolve({ data: [] as { id: string; numero_protocolo: string | null }[] }),
  ])
  const mArm = new Map(arms.map((a) => [a.id, a.nome]))
  const mMat = new Map((mats.data ?? []).map((m) => [m.id, m]))
  const mServ = new Map((servs.data ?? []).map((s) => [s.id, s.numero_protocolo]))
  const rot: Record<string, string> = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' }
  let ent = 0, sai = 0
  const linhas = movs.map((m) => {
    const q = Number(m.quantidade)
    if (m.tipo === 'entrada') ent += q
    else if (m.tipo === 'saida') sai += q
    const t = m.transferencia_id ? `Transferência (${m.tipo === 'entrada' ? 'entrada' : 'saída'})` : rot[m.tipo] ?? m.tipo
    return [
      dtHora(m.created_at), mArm.get(m.armazem_id) ?? '—', mMat.get(m.material_id)?.nome ?? '—', t,
      fmt(q), mMat.get(m.material_id)?.unidade ?? '', m.motivo ?? m.observacao ?? '',
      m.servico_id ? mServ.get(m.servico_id) ?? '' : '',
    ]
  })
  return {
    colunas: ['Data/Hora', 'Armazém', 'Material', 'Tipo', 'Qtd', 'Unid.', 'Motivo', 'OS'],
    linhas,
    rodape: [[`${linhas.length} movimentações`, `Entradas: ${fmt(ent)}`, `Saídas: ${fmt(sai)}`]],
  }
}

export async function gerarConsumo(f: FiltrosEstoque): Promise<Relatorio> {
  let q = sbEstoque
    .from('estoque_movimentacoes')
    .select('material_id, armazem_id, quantidade, servico_id, created_at')
    .eq('tipo', 'saida')
    .not('servico_id', 'is', null)
    .gte('created_at', `${f.inicio}T00:00:00-03:00`)
    .lte('created_at', `${f.fim}T23:59:59-03:00`)
    .limit(10000)
  if (f.armazemId) q = q.eq('armazem_id', f.armazemId)
  const { data, error } = await q
  if (error) throw error
  const movs = (data ?? []) as { material_id: string; armazem_id: string; quantidade: number; servico_id: string; created_at: string }[]
  const idsServ = [...new Set(movs.map((m) => m.servico_id))]
  const idsMat = [...new Set(movs.map((m) => m.material_id))]
  const servs: { id: string; numero_protocolo: string | null; tipo_servico: string; tecnico_id: string | null; uf: string; condominio_nome_original: string }[] = []
  for (let i = 0; i < idsServ.length; i += 200) {
    const r = await supabase.from('servicos_nacional_gas')
      .select('id, numero_protocolo, tipo_servico, tecnico_id, uf, condominio_nome_original')
      .in('id', idsServ.slice(i, i + 200))
    if (r.error) throw r.error
    servs.push(...(r.data ?? []))
  }
  const [mats, ops] = await Promise.all([
    idsMat.length ? supabase.from('materiais').select('id, nome, unidade').in('id', idsMat) : Promise.resolve({ data: [] as { id: string; nome: string; unidade: string }[] }),
    supabase.from('operadores').select('id, nome'),
  ])
  const mServ = new Map(servs.map((s) => [s.id, s]))
  const mMat = new Map((mats.data ?? []).map((m) => [m.id, m]))
  const mOp = new Map((ops.data ?? []).map((o) => [o.id, o.nome]))

  const grupos = new Map<string, { chave: (string | number)[]; mat: string; un: string; qtd: number; os: Set<string> }>()
  for (const m of movs) {
    const s = mServ.get(m.servico_id)
    if (!s) continue
    if (f.tipoServico && s.tipo_servico !== f.tipoServico) continue
    if (f.tecnicoId && s.tecnico_id !== f.tecnicoId) continue
    const mat = mMat.get(m.material_id)
    let chave: (string | number)[]
    if (f.agrupamento === 'tecnico') chave = [s.tecnico_id ? mOp.get(s.tecnico_id) ?? '—' : 'Não atribuído']
    else if (f.agrupamento === 'os') chave = [s.numero_protocolo ?? '—', dtHora(m.created_at).slice(0, 10), s.uf, s.condominio_nome_original, s.tipo_servico]
    else chave = [s.tipo_servico]
    const k = `${chave.join('|')}|${m.material_id}`
    const g = grupos.get(k) ?? { chave, mat: mat?.nome ?? '—', un: mat?.unidade ?? '', qtd: 0, os: new Set<string>() }
    g.qtd += Number(m.quantidade)
    g.os.add(m.servico_id)
    grupos.set(k, g)
  }
  const ordenado = [...grupos.values()].sort((a, b) => String(a.chave[0]).localeCompare(String(b.chave[0])) || a.mat.localeCompare(b.mat))
  const totalOS = new Set([...grupos.values()].flatMap((g) => [...g.os])).size
  if (f.agrupamento === 'os') {
    return {
      colunas: ['OS', 'Data baixa', 'UF', 'Condomínio', 'Tipo de serviço', 'Material', 'Qtd', 'Unid.'],
      linhas: ordenado.map((g) => [...g.chave, g.mat, fmt(g.qtd), g.un]),
      rodape: [[`${totalOS} OS com consumo`]],
    }
  }
  return {
    colunas: [f.agrupamento === 'tecnico' ? 'Técnico' : 'Tipo de serviço', 'Material', 'Qtd total', 'Unid.', 'Nº de OS'],
    linhas: ordenado.map((g) => [...g.chave, g.mat, fmt(g.qtd), g.un, g.os.size]),
    rodape: [[`${totalOS} OS com consumo`]],
  }
}
