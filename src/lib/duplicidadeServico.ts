// Regra única de duplicidade de serviços da Nacional Gás.
// Duplicado = mesmo condomínio (UF + nome) + mesma unidade (bloco + apartamento)
// + mesmo cliente/morador + mesmo tipo de serviço, considerando apenas
// serviços EM ABERTO (pendente/agendado).

export const STATUS_ABERTO = ['pendente', 'agendado'] as const

export const normText = (v: string | null | undefined): string =>
  (v ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

export const normCondo = (v: string | null | undefined): string => {
  let s = normText(v)
  // remove sufixos tipo "(gti)", "(fs)" e prefixo de UF "ba "
  s = s.replace(/\([^)]*\)/g, ' ')
  s = s.replace(/^ba\s+/, ' ')
  // remove palavras genéricas
  s = s.replace(/\b(condominio|cond|residencial|resid|edificio|ed)\b/g, ' ')
  s = s.replace(/[^a-z0-9]/g, '')
  return s
}


export const normUnidade = (v: string | null | undefined): string => {
  let s = normText(v).replace(/[^a-z0-9]/g, '')
  if (s === 'unico' || s === 'u') s = ''
  s = s.replace(/^0+/, '')
  return s
}

export interface ServicoChaveInput {
  uf?: string | null
  condominio_nome_original?: string | null
  bloco?: string | null
  apartamento?: string | null
  morador_nome?: string | null
  tipo_servico?: string | null
}

/** Chave normalizada de duplicidade */
export const makeServicoDupKey = (row: ServicoChaveInput): string =>
  [
    normText(row.uf),
    normCondo(row.condominio_nome_original),
    normUnidade(row.bloco),
    normUnidade(row.apartamento),
    normText(row.morador_nome).replace(/[^a-z0-9]/g, ''),
    normText(row.tipo_servico).replace(/[^a-z0-9]/g, ''),
  ].join('|')

/** Descrição legível da unidade, para mensagens ao usuário */
export const descreverUnidade = (row: ServicoChaveInput): string => {
  const partes = [row.condominio_nome_original || '']
  if (row.bloco) partes.push(`BL ${row.bloco}`)
  if (row.apartamento) partes.push(`AP ${row.apartamento}`)
  return partes.filter(Boolean).join(' ')
}

type MinimalClient = {
  from: (table: string) => any
}

/**
 * Busca um serviço em aberto com a mesma chave de duplicidade.
 * Retorna o registro existente ou null.
 */
export async function buscarServicoDuplicado(
  client: MinimalClient,
  row: ServicoChaveInput
): Promise<{ id: string; numero_protocolo: string | null; status_atendimento: string } | null> {
  const chave = makeServicoDupKey(row)

  let query = client
    .from('servicos_nacional_gas')
    .select('id, numero_protocolo, status_atendimento, uf, condominio_nome_original, bloco, apartamento, morador_nome, tipo_servico')
    .in('status_atendimento', STATUS_ABERTO as unknown as string[])
    .limit(1000)

  if (row.uf) query = query.eq('uf', String(row.uf).toUpperCase())

  const { data, error } = await query
  if (error) throw error

  const achado = (data || []).find((s: any) => makeServicoDupKey(s) === chave)
  return achado
    ? { id: achado.id, numero_protocolo: achado.numero_protocolo, status_atendimento: achado.status_atendimento }
    : null
}
